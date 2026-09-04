// Deterministic interview state machine. Pure functions only — no DB, no
// LLM calls. The API layer (stage 5) owns persistence and decides *when* to
// call the follow-up/classification model; this module only knows the fixed
// script and how to move through it.

import {
  MAX_TOP_PROBLEMS,
  PROBLEM_DEEP_DIVE_STEP_PREFIXES,
  PROBLEM_DEEP_DIVE_TEMPLATE,
  QuestionDef,
  buildDeepDiveStepId,
  getFixedStep,
} from "./questionBank";

export type InterviewStatus = "in_progress" | "completed" | "declined";

export interface InterviewRuntimeState {
  stepId: string;
  status: InterviewStatus;
  /** Follow-ups asked so far for the current step (0-2), reset on every transition. */
  followUpCount: number;
  topProblemKeys: string[];
  problemLoopIndex: number;
  problemLoopSubIndex: number;
}

export interface AdvanceEvent {
  /** Required when leaving CONSENT_Q. */
  consentAnswer?: boolean;
  /** Required when leaving ADM_RANK — resolved upstream (see stage 5/11) against PROBLEM_TAXONOMY. */
  topProblemKeys?: string[];
  /** Required when leaving CL_CONTACT_CONSENT. */
  contactConsentAnswer?: boolean;
}

// The linear script, excluding the dynamic problem-deep-dive loop and the
// conditional contact-detail steps — those are spliced in at runtime.
const BASE_SPINE: string[] = [
  "INTRO_1",
  "INTRO_2",
  "CONSENT_Q",
  "SCR_NAME",
  "SCR_BUSINESS",
  "SCR_ROLE",
  "SCR_YEARS",
  "SCR_TEAMSIZE",
  "SCR_WORKTYPE",
  "SCR_TOOLS",
  "CB_STORY",
  "CB_CHANNEL",
  "CB_INFO_GIVEN",
  "CB_INFO_MISSING",
  "CB_MEDIA",
  "CB_SITEVISIT",
  "CB_CALC",
  "CB_PRICE_SOURCE",
  "CB_CHECKS",
  "CB_TIME",
  "CB_TOOLS_USED",
  "ADM_LIST",
  "ADM_RANK",
  "CT_INTRO",
  "CT_USEFUL",
  "CT_USELESS",
  "CT_TRUST",
  "CT_CHECK",
  "CT_MISTAKES",
  "CT_FIT",
  "CT_BLOCKERS",
  "CT_EVIDENCE",
  "CM_CALL",
  "CM_SHOWPROCESS",
  "CM_PROTOTYPE",
  "CM_ANON",
  "CM_PILOT",
  "CM_SPEND",
  "CM_PAY",
  "CL_THANKS",
  "CL_CONTACT_CONSENT",
  "CL_FINAL",
  "CL_SIGNOFF",
];

if (process.env.NODE_ENV !== "production") {
  for (const id of BASE_SPINE) {
    if (!getFixedStep(id)) {
      throw new Error(`BASE_SPINE references unknown question id: ${id}`);
    }
  }
}

export const TERMINAL_STEP = "COMPLETE";
export const DECLINED_STEP = "DECLINED_EXIT";

export function createInitialState(): InterviewRuntimeState {
  return {
    stepId: BASE_SPINE[0],
    status: "in_progress",
    followUpCount: 0,
    topProblemKeys: [],
    problemLoopIndex: 0,
    problemLoopSubIndex: 0,
  };
}

export function isDeepDiveStepId(stepId: string): boolean {
  const [prefix] = stepId.split("::");
  return (PROBLEM_DEEP_DIVE_STEP_PREFIXES as readonly string[]).includes(prefix);
}

export function isStatementStep(stepId: string): boolean {
  if (stepId === TERMINAL_STEP || stepId === DECLINED_STEP) return false;
  return getCurrentQuestion({ ...createInitialState(), stepId } as InterviewRuntimeState).kind === "statement";
}

/** Resolves the QuestionDef for the state's current step, including synthesized deep-dive steps. */
export function getCurrentQuestion(state: InterviewRuntimeState): QuestionDef {
  if (isDeepDiveStepId(state.stepId)) {
    const [prefix, problemKey] = state.stepId.split("::");
    const idx = PROBLEM_DEEP_DIVE_STEP_PREFIXES.indexOf(
      prefix as (typeof PROBLEM_DEEP_DIVE_STEP_PREFIXES)[number],
    );
    const template = PROBLEM_DEEP_DIVE_TEMPLATE[idx];
    if (!template || !problemKey) {
      throw new Error(`Malformed deep-dive step id: ${state.stepId}`);
    }
    return { id: state.stepId, ...template };
  }

  const fixed = getFixedStep(state.stepId);
  if (fixed) return fixed;

  if (state.stepId === DECLINED_STEP) {
    return getFixedStep(DECLINED_STEP)!;
  }

  throw new Error(`Unknown step id: ${state.stepId}`);
}

export function canAskFollowUp(state: InterviewRuntimeState): boolean {
  if (state.status !== "in_progress") return false;
  const question = getCurrentQuestion(state);
  return question.allowFollowUp && state.followUpCount < 2;
}

export function markFollowUpAsked(state: InterviewRuntimeState): InterviewRuntimeState {
  return { ...state, followUpCount: state.followUpCount + 1 };
}

function nextOnBaseSpine(fromStepId: string): string {
  const idx = BASE_SPINE.indexOf(fromStepId);
  if (idx === -1 || idx === BASE_SPINE.length - 1) {
    throw new Error(`Cannot advance past end of spine from: ${fromStepId}`);
  }
  return BASE_SPINE[idx + 1];
}

function startDeepDive(topProblemKeys: string[]): Pick<
  InterviewRuntimeState,
  "stepId" | "topProblemKeys" | "problemLoopIndex" | "problemLoopSubIndex"
> {
  const problemKey = topProblemKeys[0];
  return {
    stepId: buildDeepDiveStepId(PROBLEM_DEEP_DIVE_STEP_PREFIXES[0], problemKey),
    topProblemKeys,
    problemLoopIndex: 0,
    problemLoopSubIndex: 0,
  };
}

function advanceDeepDive(state: InterviewRuntimeState): InterviewRuntimeState {
  const nextSub = state.problemLoopSubIndex + 1;
  if (nextSub < PROBLEM_DEEP_DIVE_STEP_PREFIXES.length) {
    const problemKey = state.topProblemKeys[state.problemLoopIndex];
    return {
      ...state,
      stepId: buildDeepDiveStepId(PROBLEM_DEEP_DIVE_STEP_PREFIXES[nextSub], problemKey),
      problemLoopSubIndex: nextSub,
      followUpCount: 0,
    };
  }

  const nextProblem = state.problemLoopIndex + 1;
  if (nextProblem < state.topProblemKeys.length) {
    const problemKey = state.topProblemKeys[nextProblem];
    return {
      ...state,
      stepId: buildDeepDiveStepId(PROBLEM_DEEP_DIVE_STEP_PREFIXES[0], problemKey),
      problemLoopIndex: nextProblem,
      problemLoopSubIndex: 0,
      followUpCount: 0,
    };
  }

  // Loop exhausted — resume the base spine as if we'd just left ADM_RANK.
  return { ...state, stepId: nextOnBaseSpine("ADM_RANK"), followUpCount: 0 };
}

/**
 * Advances from state.stepId given the participant's answer (already
 * persisted by the caller) and any resolved branch data in `event`.
 * Always resets followUpCount for the new step.
 */
export function advance(state: InterviewRuntimeState, event: AdvanceEvent = {}): InterviewRuntimeState {
  const cur = state.stepId;

  if (cur === DECLINED_STEP || state.status !== "in_progress") {
    return state;
  }

  if (cur === "CONSENT_Q") {
    if (event.consentAnswer === false) {
      return { ...state, stepId: DECLINED_STEP, status: "declined", followUpCount: 0 };
    }
    return { ...state, stepId: nextOnBaseSpine(cur), followUpCount: 0 };
  }

  if (cur === "ADM_RANK") {
    const topProblemKeys = (event.topProblemKeys ?? []).slice(0, MAX_TOP_PROBLEMS);
    if (topProblemKeys.length === 0) {
      return { ...state, stepId: nextOnBaseSpine(cur), followUpCount: 0 };
    }
    return { ...state, ...startDeepDive(topProblemKeys), followUpCount: 0 };
  }

  if (isDeepDiveStepId(cur)) {
    return advanceDeepDive(state);
  }

  if (cur === "CL_CONTACT_CONSENT") {
    const nextStepId = event.contactConsentAnswer === false ? "CL_FINAL" : "CL_CONTACT_METHOD";
    return { ...state, stepId: nextStepId, followUpCount: 0 };
  }

  if (cur === "CL_CONTACT_METHOD") {
    return { ...state, stepId: "CL_CONTACT_VALUE", followUpCount: 0 };
  }

  if (cur === "CL_CONTACT_VALUE") {
    return { ...state, stepId: "CL_FINAL", followUpCount: 0 };
  }

  if (cur === "CL_SIGNOFF") {
    return { ...state, stepId: TERMINAL_STEP, status: "completed", followUpCount: 0 };
  }

  return { ...state, stepId: nextOnBaseSpine(cur), followUpCount: 0 };
}

/** True once the interview has finished, one way or another. */
export function isTerminal(state: InterviewRuntimeState): boolean {
  return state.stepId === TERMINAL_STEP || state.status !== "in_progress";
}
