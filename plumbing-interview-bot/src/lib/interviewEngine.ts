// Orchestrates one turn of the interview: persists the participant's
// answer, decides whether to follow up or advance, and returns the next
// bot message(s). This is the only place state machine + LLM + DB meet —
// route handlers should stay thin wrappers around these two functions.

import {
  advance,
  canAskFollowUp,
  createInitialState,
  DECLINED_STEP,
  getCurrentQuestion,
  isDeepDiveStepId,
  isTerminal,
  markFollowUpAsked,
  TERMINAL_STEP,
  type AdvanceEvent,
  type InterviewRuntimeState,
} from "@/lib/interviewStateMachine";
import { classifyTopProblems, classifyYesNo } from "@/lib/anthropic/classify";
import { decideFollowUp } from "@/lib/anthropic/followUp";
import { applyStructuredCapture } from "@/lib/structuredCapture";
import { upsertProblemRating } from "@/lib/db/outcomes";
import {
  appendMessages,
  createParticipantAndInterview,
  saveInterviewState,
  updateInterviewFields,
  updateParticipantFields,
  type InterviewRow,
  type MessageRow,
  type NewMessage,
  type ParticipantRow,
} from "@/lib/db/interviews";

export class InterviewApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const DEEP_DIVE_FIELD_BY_PREFIX: Record<string, "frequency" | "time_lost" | "financial_consequence" | "current_workaround" | "existing_software" | "satisfaction" | "urgency"> = {
  ADM_FREQ: "frequency",
  ADM_TIME: "time_lost",
  ADM_MONEY: "financial_consequence",
  ADM_WORKAROUND: "current_workaround",
  ADM_SOFTWARE: "existing_software",
  ADM_SATISFACTION: "satisfaction",
  ADM_URGENCY: "urgency",
};

function botMessagesForAutoAdvance(startState: InterviewRuntimeState): { finalState: InterviewRuntimeState; messages: NewMessage[] } {
  const messages: NewMessage[] = [];
  let state = startState;

  while (state.stepId !== TERMINAL_STEP) {
    const question = getCurrentQuestion(state);
    messages.push({ role: "bot", content: question.text, question_id: question.id });

    if (state.status !== "in_progress") break; // e.g. DECLINED_STEP: show the message, then stop
    if (question.kind !== "statement") break; // needs participant input — stop and wait
    state = advance(state);
  }

  return { finalState: state, messages };
}

export async function startInterview(): Promise<{
  resumeToken: string;
  interview: InterviewRow;
  messages: MessageRow[];
}> {
  const initialState = createInitialState();
  const { participant, interview } = await createParticipantAndInterview(initialState);

  const { finalState, messages } = botMessagesForAutoAdvance(initialState);
  await saveInterviewState(interview.id, finalState);
  const savedMessages = await appendMessages(interview.id, messages);

  return { resumeToken: participant.resume_token, interview: { ...interview, ...finalState, current_step: finalState.stepId, status: finalState.status }, messages: savedMessages };
}

export interface ProcessAnswerResult {
  interview: InterviewRow;
  newMessages: MessageRow[];
  isTerminal: boolean;
}

export async function processAnswer(params: {
  participant: ParticipantRow;
  interview: InterviewRow;
  answerText: string;
  skipped: boolean;
}): Promise<ProcessAnswerResult> {
  const { participant, interview } = params;
  const answerText = params.answerText?.trim() ?? "";
  const skipped = params.skipped || (!answerText && true);
  const state = interview.state_json;

  if (isTerminal(state)) {
    throw new InterviewApiError("This interview has already finished.", 409);
  }

  const question = getCurrentQuestion(state);

  if (skipped && !question.skippable) {
    throw new InterviewApiError("This question can't be skipped.", 400);
  }
  if (!skipped && !answerText) {
    throw new InterviewApiError("An answer is required.", 400);
  }

  const isAnsweringFollowUp = state.followUpCount > 0;
  await appendMessages(interview.id, [
    {
      role: "user",
      content: skipped ? "" : answerText,
      question_id: question.id,
      is_follow_up: isAnsweringFollowUp,
      follow_up_index: isAnsweringFollowUp ? state.followUpCount : null,
      skipped,
    },
  ]);

  if (!skipped && !isAnsweringFollowUp) {
    await captureStructuredAnswer({ participant, interview, state, questionId: question.id, answerText });
  }

  // Follow-up check — only for the primary answer, never after a skip, and
  // never once the per-question cap is reached.
  if (!skipped && canAskFollowUp(state)) {
    const decision = await decideFollowUp({
      questionText: question.text,
      answerText,
      followUpsAlreadyAsked: state.followUpCount,
    });
    if (decision.shouldFollowUp && decision.followUpQuestion) {
      const nextState = markFollowUpAsked(state);
      await saveInterviewState(interview.id, nextState);
      const [followUpMessage] = await appendMessages(interview.id, [
        { role: "bot", content: decision.followUpQuestion, question_id: question.id, is_follow_up: true, follow_up_index: nextState.followUpCount },
      ]);
      return { interview: { ...interview, ...nextState }, newMessages: [followUpMessage], isTerminal: false };
    }
  }

  // Resolve any branch-specific event data needed to leave this step.
  const branch = await resolveBranchEvent({ questionId: question.id, answerText, skipped });
  if (branch.kind === "unclear") {
    const [clarifyMessage] = await appendMessages(interview.id, [
      { role: "bot", content: branch.clarifyingText, question_id: question.id },
    ]);
    return { interview, newMessages: [clarifyMessage], isTerminal: false };
  }

  if (question.id === "CL_CONTACT_CONSENT" && !skipped) {
    await updateParticipantFields(participant.id, { follow_up_consent: branch.event.contactConsentAnswer ?? false });
  }
  if (question.id === "CONSENT_Q" && !skipped && branch.event.consentAnswer) {
    await updateInterviewFields(interview.id, { consent_given_at: new Date().toISOString(), data_processing_consent: true });
  }

  if (isDeepDiveStepId(state.stepId) && !skipped) {
    await captureDeepDiveAnswer(interview.id, state, answerText);
  }

  const advancedState = advance(state, branch.event);
  const { finalState, messages } = botMessagesForAutoAdvance(advancedState);
  await saveInterviewState(interview.id, finalState);
  const savedMessages = await appendMessages(interview.id, messages);

  return {
    interview: { ...interview, ...finalState, current_step: finalState.stepId, status: finalState.status },
    newMessages: savedMessages,
    isTerminal: isTerminal(finalState),
  };
}

async function captureStructuredAnswer(args: {
  participant: ParticipantRow;
  interview: InterviewRow;
  state: InterviewRuntimeState;
  questionId: string;
  answerText: string;
}): Promise<void> {
  if (isDeepDiveStepId(args.state.stepId)) return; // handled separately, after branch resolution
  await applyStructuredCapture({
    participant: args.participant,
    interview: args.interview,
    questionId: args.questionId,
    answerText: args.answerText,
  });
}

async function captureDeepDiveAnswer(interviewId: string, state: InterviewRuntimeState, answerText: string): Promise<void> {
  const [prefix, problemKey] = state.stepId.split("::");
  const field = DEEP_DIVE_FIELD_BY_PREFIX[prefix];
  if (!field || !problemKey) return;
  await upsertProblemRating({
    interviewId,
    problemKey,
    rank: state.problemLoopIndex + 1,
    field,
    value: answerText,
  });
}

type BranchResolution = { kind: "event"; event: AdvanceEvent } | { kind: "unclear"; clarifyingText: string };

async function resolveBranchEvent(params: {
  questionId: string;
  answerText: string;
  skipped: boolean;
}): Promise<BranchResolution> {
  const { questionId, answerText, skipped } = params;

  if (questionId === "CONSENT_Q") {
    const yn = skipped ? null : await classifyYesNo(answerText);
    if (yn === null) return { kind: "unclear", clarifyingText: "Sorry, just to check — is that a yes or a no?" };
    return { kind: "event", event: { consentAnswer: yn } };
  }

  if (questionId === "ADM_RANK") {
    const topProblemKeys = skipped ? [] : await classifyTopProblems(answerText);
    return { kind: "event", event: { topProblemKeys } };
  }

  if (questionId === "CL_CONTACT_CONSENT") {
    const yn = skipped ? false : await classifyYesNo(answerText);
    if (yn === null) return { kind: "unclear", clarifyingText: "Sorry, just to check — is that a yes or a no?" };
    return { kind: "event", event: { contactConsentAnswer: yn } };
  }

  return { kind: "event", event: {} };
}

// Re-exported for API routes that need to guard against a declined/completed
// interview before rendering the chat.
export { DECLINED_STEP };
