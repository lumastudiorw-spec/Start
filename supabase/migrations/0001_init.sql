-- Plumbing interview bot — initial schema.
-- Run once in the Supabase SQL editor (Project -> SQL Editor -> paste -> Run).
--
-- All tables have RLS enabled with no policies, i.e. default-deny for the
-- anon/authenticated roles. The app talks to Supabase only via the
-- service_role key from server-side Next.js Route Handlers, which bypasses
-- RLS entirely — RLS here is defence in depth against a key ever leaking
-- into a client-side context, not the primary access control.

create extension if not exists "pgcrypto";

-- Participants: contact info, kept separate from research content.
create table participants (
  id uuid primary key default gen_random_uuid(),
  resume_token uuid not null unique default gen_random_uuid(),
  first_name text,
  business_name text,
  contact_method text check (contact_method in ('phone', 'email', 'whatsapp')),
  contact_value text,
  follow_up_consent boolean not null default false,
  prototype_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'declined', 'abandoned')),
  current_step text not null default 'INTRO_1',
  -- Full serialized InterviewRuntimeState (see src/lib/interviewStateMachine.ts):
  -- follow-up count, top problem keys, loop position. current_step/status
  -- above are denormalized copies of fields inside this for easy filtering;
  -- state_json is the source of truth the state machine resumes from.
  state_json jsonb not null default '{}'::jsonb,
  consent_given_at timestamptz,
  data_processing_consent boolean not null default false,
  role text,
  years_experience text,
  team_size_band text check (team_size_band in ('solo', '2-5', '6-20', '20+')),
  work_type text check (work_type in ('reactive', 'maintenance', 'installations', 'mixed')),
  current_tools text[],
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  completed_at timestamptz
);
create index interviews_participant_id_idx on interviews(participant_id);
create index interviews_status_idx on interviews(status);

-- Full transcript AND the structured per-question answer store — every
-- question/answer/follow-up/skip is one row here, in order.
create table messages (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  role text not null check (role in ('bot', 'user')),
  content text not null,
  question_id text,
  is_follow_up boolean not null default false,
  follow_up_index int check (follow_up_index between 1 and 2),
  skipped boolean not null default false,
  order_index int not null,
  created_at timestamptz not null default now()
);
create index messages_interview_id_order_idx on messages(interview_id, order_index);

-- Fixed taxonomy of admin problem areas — seeded below, closed set.
create table problems (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null
);

create table interview_problem_ratings (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  problem_id uuid not null references problems(id),
  rank int,
  frequency text,
  time_lost text,
  financial_consequence text,
  current_workaround text,
  existing_software text,
  satisfaction text,
  urgency text,
  source text not null check (source in ('participant_stated', 'ai_inferred')),
  created_at timestamptz not null default now()
);
create index interview_problem_ratings_interview_id_idx on interview_problem_ratings(interview_id);
create index interview_problem_ratings_problem_id_idx on interview_problem_ratings(problem_id);

create table notable_quotes (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  quote_text text not null,
  related_problem_id uuid references problems(id),
  context_question_id text,
  created_at timestamptz not null default now()
);
create index notable_quotes_interview_id_idx on notable_quotes(interview_id);

-- 1:1 with interview: concept-testing reactions + commitment-testing answers.
create table interview_outcomes (
  interview_id uuid primary key references interviews(id) on delete cascade,
  concept_useful text,
  concept_dealbreakers text,
  concept_trusted_parts text,
  concept_must_check text,
  concept_worst_mistake text,
  concept_workflow_fit text,
  concept_adoption_blockers text,
  concept_evidence_needed text,
  will_call_20min boolean,
  will_show_process boolean,
  will_test_prototype boolean,
  will_test_anon_jobs boolean,
  will_pilot boolean,
  current_spend text,
  pay_view text,
  commitment_strength text check (commitment_strength in ('agreed', 'interested', 'declined')),
  final_comment text
);

create table ai_summaries (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  summary_text text not null,
  top_problems jsonb not null default '[]',
  tags jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  edited_by_human boolean not null default false,
  human_edited_at timestamptz
);
create index ai_summaries_interview_id_idx on ai_summaries(interview_id);

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'researcher'
);

create table follow_up_flags (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  flagged_by uuid references admin_users(id),
  reason text,
  status text not null default 'open' check (status in ('open', 'contacted', 'done')),
  created_at timestamptz not null default now()
);
create index follow_up_flags_interview_id_idx on follow_up_flags(interview_id);

-- RLS: enabled everywhere, no policies -> default deny for anon/authenticated.
alter table participants enable row level security;
alter table interviews enable row level security;
alter table messages enable row level security;
alter table problems enable row level security;
alter table interview_problem_ratings enable row level security;
alter table notable_quotes enable row level security;
alter table interview_outcomes enable row level security;
alter table ai_summaries enable row level security;
alter table admin_users enable row level security;
alter table follow_up_flags enable row level security;

-- Seed the fixed problem taxonomy (must match src/lib/problemTaxonomy.ts).
insert into problems (key, label) values
  ('enquiry_qualification', 'Qualifying new enquiries'),
  ('info_collection', 'Collecting customer information'),
  ('quoting', 'Preparing quotes'),
  ('chasing_quotes', 'Chasing unanswered quotes'),
  ('scheduling', 'Scheduling and dispatch'),
  ('customer_updates', 'Customer updates'),
  ('invoicing', 'Invoicing and payment chasing'),
  ('job_records', 'Job records and paperwork'),
  ('stock_materials', 'Materials and stock'),
  ('staff_management', 'Managing employees or subcontractors'),
  ('other', 'Something else');
