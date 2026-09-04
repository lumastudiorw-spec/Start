// Maps a fixed question's raw answer onto the structured DB columns the
// dashboard reads. Only runs for the primary answer to a question (not
// follow-up elaborations) and never when the participant skipped.

import { classifyYesNo } from "@/lib/anthropic/classify";
import { mapContactMethod, mapTeamSizeBand, mapWorkType, parseToolsList } from "@/lib/answerMapping";
import { updateInterviewFields, updateParticipantFields, type InterviewRow, type ParticipantRow } from "@/lib/db/interviews";
import { getInterviewOutcome, upsertInterviewOutcome } from "@/lib/db/outcomes";

const CONCEPT_FIELD_BY_QUESTION: Record<string, string> = {
  CT_USEFUL: "concept_useful",
  CT_USELESS: "concept_dealbreakers",
  CT_TRUST: "concept_trusted_parts",
  CT_CHECK: "concept_must_check",
  CT_MISTAKES: "concept_worst_mistake",
  CT_FIT: "concept_workflow_fit",
  CT_BLOCKERS: "concept_adoption_blockers",
  CT_EVIDENCE: "concept_evidence_needed",
};

const YES_NO_OUTCOME_FIELD_BY_QUESTION: Record<string, string> = {
  CM_CALL: "will_call_20min",
  CM_SHOWPROCESS: "will_show_process",
  CM_PROTOTYPE: "will_test_prototype",
  CM_ANON: "will_test_anon_jobs",
  CM_PILOT: "will_pilot",
};

export async function applyStructuredCapture(params: {
  participant: ParticipantRow;
  interview: InterviewRow;
  questionId: string;
  answerText: string;
}): Promise<void> {
  const { participant, interview, questionId, answerText } = params;
  const trimmed = answerText.trim();
  if (!trimmed) return;

  switch (questionId) {
    case "SCR_NAME":
      await updateParticipantFields(participant.id, { first_name: trimmed });
      return;
    case "SCR_BUSINESS":
      await updateParticipantFields(participant.id, { business_name: trimmed });
      return;
    case "SCR_ROLE":
      await updateInterviewFields(interview.id, { role: trimmed });
      return;
    case "SCR_YEARS":
      await updateInterviewFields(interview.id, { years_experience: trimmed });
      return;
    case "SCR_TEAMSIZE": {
      const band = mapTeamSizeBand(trimmed);
      if (band) await updateInterviewFields(interview.id, { team_size_band: band });
      return;
    }
    case "SCR_WORKTYPE": {
      const workType = mapWorkType(trimmed);
      if (workType) await updateInterviewFields(interview.id, { work_type: workType });
      return;
    }
    case "SCR_TOOLS":
      await updateInterviewFields(interview.id, { current_tools: parseToolsList(trimmed) });
      return;
    case "CL_CONTACT_METHOD": {
      const method = mapContactMethod(trimmed);
      if (method) await updateParticipantFields(participant.id, { contact_method: method });
      return;
    }
    case "CL_CONTACT_VALUE":
      await updateParticipantFields(participant.id, { contact_value: trimmed });
      return;
    case "CL_FINAL":
      await upsertInterviewOutcome(interview.id, { final_comment: trimmed });
      return;
    case "CM_SPEND":
      await upsertInterviewOutcome(interview.id, { current_spend: trimmed });
      return;
    case "CM_PAY":
      await upsertInterviewOutcome(interview.id, { pay_view: trimmed });
      return;
  }

  if (questionId in CONCEPT_FIELD_BY_QUESTION) {
    await upsertInterviewOutcome(interview.id, { [CONCEPT_FIELD_BY_QUESTION[questionId]]: trimmed });
    return;
  }

  if (questionId in YES_NO_OUTCOME_FIELD_BY_QUESTION) {
    const answer = await classifyYesNo(trimmed);
    await upsertInterviewOutcome(interview.id, { [YES_NO_OUTCOME_FIELD_BY_QUESTION[questionId]]: answer });

    if (questionId === "CM_ANON") {
      const outcome = await getInterviewOutcome(interview.id);
      if (outcome) {
        await updateParticipantFields(participant.id, {
          prototype_consent: Boolean(outcome.will_test_prototype || outcome.will_test_anon_jobs),
        });
      }
    }
  }
}
