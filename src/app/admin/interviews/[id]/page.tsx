import Link from "next/link";
import { notFound } from "next/navigation";
import { getInterviewDetail } from "@/lib/db/adminQueries";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="text-sm">
      <span className="text-zinc-500">{label}: </span>
      <span className="text-zinc-900">{typeof value === "boolean" ? (value ? "Yes" : "No") : value}</span>
    </div>
  );
}

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getInterviewDetail(id);
  if (!detail) notFound();

  const { interview, participant, messages, outcome, problemRatings, summary } = detail;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/interviews" className="mb-4 inline-block text-sm text-zinc-400 underline">
        ← All interviews
      </Link>

      <h1 className="mb-1 text-lg font-semibold text-zinc-900">
        {participant.first_name ?? "(no name yet)"}
        {participant.business_name ? ` · ${participant.business_name}` : ""}
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        {interview.status.replace("_", " ")} · started {new Date(interview.started_at).toLocaleString()}
      </p>

      <section className="mb-6 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <Field label="Role" value={interview.role} />
        <Field label="Years in plumbing" value={interview.years_experience} />
        <Field label="Team size" value={interview.team_size_band} />
        <Field label="Work type" value={interview.work_type} />
        <Field label="Tools" value={interview.current_tools?.join(", ")} />
        <Field label="Contact method" value={participant.contact_method} />
        <Field label="Contact" value={participant.contact_value} />
        <Field label="Follow-up OK" value={participant.follow_up_consent} />
        <Field label="Prototype-testing OK" value={participant.prototype_consent} />
      </section>

      <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-zinc-900">AI summary</h2>
        {summary ? (
          <p className="text-sm whitespace-pre-wrap text-zinc-700">{summary.summary_text}</p>
        ) : (
          <p className="text-sm text-zinc-400">Not generated yet.</p>
        )}
      </section>

      {problemRatings.length > 0 && (
        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-zinc-900">Top problems (participant&apos;s own ranking)</h2>
          <div className="flex flex-col gap-4">
            {problemRatings.map((r) => (
              <div key={r.id} className="border-l-2 border-zinc-200 pl-3">
                <div className="text-sm font-medium text-zinc-900">
                  {r.rank ? `#${r.rank} ` : ""}
                  {r.problem_label}
                  {r.source === "ai_inferred" && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">AI inferred</span>
                  )}
                </div>
                <Field label="Frequency" value={r.frequency} />
                <Field label="Time lost" value={r.time_lost} />
                <Field label="Financial consequence" value={r.financial_consequence} />
                <Field label="Current workaround" value={r.current_workaround} />
                <Field label="Existing software" value={r.existing_software} />
                <Field label="Satisfaction with workaround" value={r.satisfaction} />
                <Field label="Urgency to fix" value={r.urgency} />
              </div>
            ))}
          </div>
        </section>
      )}

      {outcome && (
        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-zinc-900">Concept reaction &amp; commitment</h2>
          <div className="flex flex-col gap-1">
            <Field label="Useful" value={outcome.concept_useful} />
            <Field label="Dealbreakers" value={outcome.concept_dealbreakers} />
            <Field label="Trusted parts" value={outcome.concept_trusted_parts} />
            <Field label="Must always check" value={outcome.concept_must_check} />
            <Field label="Worst-case mistake" value={outcome.concept_worst_mistake} />
            <Field label="Workflow fit" value={outcome.concept_workflow_fit} />
            <Field label="Adoption blockers" value={outcome.concept_adoption_blockers} />
            <Field label="Evidence needed" value={outcome.concept_evidence_needed} />
            <Field label="20-min call" value={outcome.will_call_20min} />
            <Field label="Show process" value={outcome.will_show_process} />
            <Field label="Test prototype" value={outcome.will_test_prototype} />
            <Field label="Test anonymised jobs" value={outcome.will_test_anon_jobs} />
            <Field label="Pilot" value={outcome.will_pilot} />
            <Field label="Current spend" value={outcome.current_spend} />
            <Field label="View on paying" value={outcome.pay_view} />
            <Field label="Final comment" value={outcome.final_comment} />
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-zinc-900">Full transcript</h2>
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "bot" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white"
                } ${m.skipped ? "italic opacity-60" : ""}`}
              >
                {m.skipped ? "(skipped)" : m.content}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
