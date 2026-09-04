import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getMessages, type InterviewRow, type MessageRow, type ParticipantRow } from "@/lib/db/interviews";

export interface InterviewListItem {
  id: string;
  status: InterviewRow["status"];
  team_size_band: InterviewRow["team_size_band"];
  work_type: InterviewRow["work_type"];
  current_tools: string[] | null;
  started_at: string;
  completed_at: string | null;
  participant_first_name: string | null;
  participant_business_name: string | null;
}

export interface InterviewFilters {
  teamSizeBand?: string;
  workType?: string;
  status?: string;
}

interface RawInterviewListRow {
  id: string;
  status: InterviewRow["status"];
  team_size_band: InterviewRow["team_size_band"];
  work_type: InterviewRow["work_type"];
  current_tools: string[] | null;
  started_at: string;
  completed_at: string | null;
  participants: { first_name: string | null; business_name: string | null } | null;
}

export async function listInterviews(filters: InterviewFilters = {}): Promise<InterviewListItem[]> {
  const db = getSupabaseAdmin();
  let query = db
    .from("interviews")
    .select(
      "id, status, team_size_band, work_type, current_tools, started_at, completed_at, participants(first_name, business_name)",
    )
    .order("started_at", { ascending: false });

  if (filters.teamSizeBand) query = query.eq("team_size_band", filters.teamSizeBand);
  if (filters.workType) query = query.eq("work_type", filters.workType);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list interviews: ${error.message}`);

  return ((data ?? []) as unknown as RawInterviewListRow[]).map((row) => ({
    id: row.id,
    status: row.status,
    team_size_band: row.team_size_band,
    work_type: row.work_type,
    current_tools: row.current_tools,
    started_at: row.started_at,
    completed_at: row.completed_at,
    participant_first_name: row.participants?.first_name ?? null,
    participant_business_name: row.participants?.business_name ?? null,
  }));
}

export interface DashboardCounts {
  totalByStatus: Record<string, number>;
  totalByTeamSize: Record<string, number>;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("interviews").select("status, team_size_band");
  if (error) throw new Error(`Failed to load dashboard counts: ${error.message}`);

  const totalByStatus: Record<string, number> = {};
  const totalByTeamSize: Record<string, number> = {};
  for (const row of data ?? []) {
    totalByStatus[row.status] = (totalByStatus[row.status] ?? 0) + 1;
    if (row.team_size_band) totalByTeamSize[row.team_size_band] = (totalByTeamSize[row.team_size_band] ?? 0) + 1;
  }
  return { totalByStatus, totalByTeamSize };
}

export interface ProblemRatingWithLabel {
  id: string;
  problem_key: string;
  problem_label: string;
  rank: number | null;
  frequency: string | null;
  time_lost: string | null;
  financial_consequence: string | null;
  current_workaround: string | null;
  existing_software: string | null;
  satisfaction: string | null;
  urgency: string | null;
  source: "participant_stated" | "ai_inferred";
}

interface RawProblemRatingRow {
  id: string;
  rank: number | null;
  frequency: string | null;
  time_lost: string | null;
  financial_consequence: string | null;
  current_workaround: string | null;
  existing_software: string | null;
  satisfaction: string | null;
  urgency: string | null;
  source: "participant_stated" | "ai_inferred";
  problems: { key: string; label: string } | null;
}

export interface InterviewOutcomeRow {
  concept_useful: string | null;
  concept_dealbreakers: string | null;
  concept_trusted_parts: string | null;
  concept_must_check: string | null;
  concept_worst_mistake: string | null;
  concept_workflow_fit: string | null;
  concept_adoption_blockers: string | null;
  concept_evidence_needed: string | null;
  will_call_20min: boolean | null;
  will_show_process: boolean | null;
  will_test_prototype: boolean | null;
  will_test_anon_jobs: boolean | null;
  will_pilot: boolean | null;
  current_spend: string | null;
  pay_view: string | null;
  commitment_strength: "agreed" | "interested" | "declined" | null;
  final_comment: string | null;
}

export interface AiSummaryRow {
  summary_text: string;
  top_problems: unknown;
  tags: unknown;
  generated_at: string;
  edited_by_human: boolean;
}

export interface InterviewDetail {
  interview: InterviewRow;
  participant: ParticipantRow;
  messages: MessageRow[];
  outcome: InterviewOutcomeRow | null;
  problemRatings: ProblemRatingWithLabel[];
  summary: AiSummaryRow | null;
}

export async function getInterviewDetail(id: string): Promise<InterviewDetail | null> {
  const db = getSupabaseAdmin();

  const { data: interview, error: interviewError } = await db.from("interviews").select().eq("id", id).maybeSingle();
  if (interviewError) throw new Error(`Failed to load interview: ${interviewError.message}`);
  if (!interview) return null;

  const [{ data: participant, error: participantError }, messages, { data: outcome, error: outcomeError }, { data: ratings, error: ratingsError }, { data: summary, error: summaryError }] =
    await Promise.all([
      db.from("participants").select().eq("id", interview.participant_id).single(),
      getMessages(id),
      db.from("interview_outcomes").select().eq("interview_id", id).maybeSingle(),
      db
        .from("interview_problem_ratings")
        .select(
          "id, rank, frequency, time_lost, financial_consequence, current_workaround, existing_software, satisfaction, urgency, source, problems(key, label)",
        )
        .eq("interview_id", id)
        .order("rank", { ascending: true }),
      db.from("ai_summaries").select().eq("interview_id", id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  if (participantError) throw new Error(`Failed to load participant: ${participantError.message}`);
  if (outcomeError) throw new Error(`Failed to load outcome: ${outcomeError.message}`);
  if (ratingsError) throw new Error(`Failed to load problem ratings: ${ratingsError.message}`);
  if (summaryError) throw new Error(`Failed to load summary: ${summaryError.message}`);

  return {
    interview: interview as InterviewRow,
    participant: participant as ParticipantRow,
    messages,
    outcome: (outcome as InterviewOutcomeRow) ?? null,
    problemRatings: ((ratings ?? []) as unknown as RawProblemRatingRow[]).map((r) => ({
      id: r.id,
      problem_key: r.problems?.key ?? "unknown",
      problem_label: r.problems?.label ?? "Unknown",
      rank: r.rank,
      frequency: r.frequency,
      time_lost: r.time_lost,
      financial_consequence: r.financial_consequence,
      current_workaround: r.current_workaround,
      existing_software: r.existing_software,
      satisfaction: r.satisfaction,
      urgency: r.urgency,
      source: r.source,
    })),
    summary: (summary as AiSummaryRow) ?? null,
  };
}
