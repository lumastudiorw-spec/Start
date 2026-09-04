import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { InterviewRuntimeState } from "@/lib/interviewStateMachine";

export interface ParticipantRow {
  id: string;
  resume_token: string;
  first_name: string | null;
  business_name: string | null;
  contact_method: "phone" | "email" | "whatsapp" | null;
  contact_value: string | null;
  follow_up_consent: boolean;
  prototype_consent: boolean;
  created_at: string;
}

export interface InterviewRow {
  id: string;
  participant_id: string;
  status: "in_progress" | "completed" | "declined" | "abandoned";
  current_step: string;
  state_json: InterviewRuntimeState;
  consent_given_at: string | null;
  data_processing_consent: boolean;
  role: string | null;
  years_experience: string | null;
  team_size_band: "solo" | "2-5" | "6-20" | "20+" | null;
  work_type: "reactive" | "maintenance" | "installations" | "mixed" | null;
  current_tools: string[] | null;
  started_at: string;
  last_active_at: string;
  completed_at: string | null;
}

export interface MessageRow {
  id: string;
  interview_id: string;
  role: "bot" | "user";
  content: string;
  question_id: string | null;
  is_follow_up: boolean;
  follow_up_index: number | null;
  skipped: boolean;
  order_index: number;
  created_at: string;
}

export interface NewMessage {
  role: "bot" | "user";
  content: string;
  question_id?: string | null;
  is_follow_up?: boolean;
  follow_up_index?: number | null;
  skipped?: boolean;
}

export async function createParticipantAndInterview(
  initialState: InterviewRuntimeState,
): Promise<{ participant: ParticipantRow; interview: InterviewRow }> {
  const db = getSupabaseAdmin();

  const { data: participant, error: participantError } = await db
    .from("participants")
    .insert({})
    .select()
    .single();
  if (participantError || !participant) {
    throw new Error(`Failed to create participant: ${participantError?.message}`);
  }

  const { data: interview, error: interviewError } = await db
    .from("interviews")
    .insert({
      participant_id: participant.id,
      current_step: initialState.stepId,
      state_json: initialState,
    })
    .select()
    .single();
  if (interviewError || !interview) {
    throw new Error(`Failed to create interview: ${interviewError?.message}`);
  }

  return { participant: participant as ParticipantRow, interview: interview as InterviewRow };
}

export async function getInterviewByResumeToken(
  token: string,
): Promise<{ participant: ParticipantRow; interview: InterviewRow } | null> {
  const db = getSupabaseAdmin();

  const { data: participant, error: participantError } = await db
    .from("participants")
    .select()
    .eq("resume_token", token)
    .maybeSingle();
  if (participantError) throw new Error(`Failed to look up participant: ${participantError.message}`);
  if (!participant) return null;

  const { data: interview, error: interviewError } = await db
    .from("interviews")
    .select()
    .eq("participant_id", participant.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (interviewError) throw new Error(`Failed to look up interview: ${interviewError.message}`);
  if (!interview) return null;

  return { participant: participant as ParticipantRow, interview: interview as InterviewRow };
}

export async function getMessages(interviewId: string): Promise<MessageRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("messages")
    .select()
    .eq("interview_id", interviewId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return (data ?? []) as MessageRow[];
}

export async function appendMessages(interviewId: string, messages: NewMessage[]): Promise<MessageRow[]> {
  if (messages.length === 0) return [];
  const db = getSupabaseAdmin();

  const { count, error: countError } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("interview_id", interviewId);
  if (countError) throw new Error(`Failed to count messages: ${countError.message}`);

  const startIndex = count ?? 0;
  const rows = messages.map((m, i) => ({
    interview_id: interviewId,
    role: m.role,
    content: m.content,
    question_id: m.question_id ?? null,
    is_follow_up: m.is_follow_up ?? false,
    follow_up_index: m.follow_up_index ?? null,
    skipped: m.skipped ?? false,
    order_index: startIndex + i,
  }));

  const { data, error } = await db.from("messages").insert(rows).select();
  if (error) throw new Error(`Failed to insert messages: ${error.message}`);
  return (data ?? []) as MessageRow[];
}

export async function saveInterviewState(
  interviewId: string,
  state: InterviewRuntimeState,
  extraFields: Partial<InterviewRow> = {},
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("interviews")
    .update({
      current_step: state.stepId,
      status: state.status,
      state_json: state,
      last_active_at: new Date().toISOString(),
      ...(state.status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...extraFields,
    })
    .eq("id", interviewId);
  if (error) throw new Error(`Failed to save interview state: ${error.message}`);
}

export async function updateParticipantFields(
  participantId: string,
  fields: Partial<Pick<ParticipantRow, "first_name" | "business_name" | "contact_method" | "contact_value" | "follow_up_consent" | "prototype_consent">>,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("participants").update(fields).eq("id", participantId);
  if (error) throw new Error(`Failed to update participant: ${error.message}`);
}

export async function updateInterviewFields(
  interviewId: string,
  fields: Partial<
    Pick<
      InterviewRow,
      "consent_given_at" | "data_processing_consent" | "role" | "years_experience" | "team_size_band" | "work_type" | "current_tools"
    >
  >,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("interviews").update(fields).eq("id", interviewId);
  if (error) throw new Error(`Failed to update interview: ${error.message}`);
}
