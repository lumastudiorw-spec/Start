import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface InterviewOutcomeFields {
  concept_useful?: string;
  concept_dealbreakers?: string;
  concept_trusted_parts?: string;
  concept_must_check?: string;
  concept_worst_mistake?: string;
  concept_workflow_fit?: string;
  concept_adoption_blockers?: string;
  concept_evidence_needed?: string;
  will_call_20min?: boolean | null;
  will_show_process?: boolean | null;
  will_test_prototype?: boolean | null;
  will_test_anon_jobs?: boolean | null;
  will_pilot?: boolean | null;
  current_spend?: string;
  pay_view?: string;
  final_comment?: string;
}

export async function upsertInterviewOutcome(interviewId: string, fields: InterviewOutcomeFields): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("interview_outcomes")
    .upsert({ interview_id: interviewId, ...fields }, { onConflict: "interview_id" });
  if (error) throw new Error(`Failed to upsert interview outcome: ${error.message}`);
}

export async function getInterviewOutcome(
  interviewId: string,
): Promise<{ will_test_prototype: boolean | null; will_test_anon_jobs: boolean | null } | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("interview_outcomes")
    .select("will_test_prototype, will_test_anon_jobs")
    .eq("interview_id", interviewId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load interview outcome: ${error.message}`);
  return data;
}

type ProblemRatingField =
  | "frequency"
  | "time_lost"
  | "financial_consequence"
  | "current_workaround"
  | "existing_software"
  | "satisfaction"
  | "urgency";

export async function upsertProblemRating(params: {
  interviewId: string;
  problemKey: string;
  rank: number;
  field: ProblemRatingField;
  value: string;
}): Promise<void> {
  const db = getSupabaseAdmin();

  const { data: problem, error: problemError } = await db
    .from("problems")
    .select("id")
    .eq("key", params.problemKey)
    .single();
  if (problemError || !problem) {
    throw new Error(`Unknown problem key "${params.problemKey}": ${problemError?.message}`);
  }

  const { data: existing, error: existingError } = await db
    .from("interview_problem_ratings")
    .select("id")
    .eq("interview_id", params.interviewId)
    .eq("problem_id", problem.id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await db
      .from("interview_problem_ratings")
      .update({ [params.field]: params.value, rank: params.rank })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("interview_problem_ratings").insert({
      interview_id: params.interviewId,
      problem_id: problem.id,
      rank: params.rank,
      source: "participant_stated",
      [params.field]: params.value,
    });
    if (error) throw new Error(error.message);
  }
}
