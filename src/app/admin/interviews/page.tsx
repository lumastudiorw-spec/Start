import Link from "next/link";
import { listInterviews } from "@/lib/db/adminQueries";

export const dynamic = "force-dynamic";

const TEAM_SIZE_OPTIONS = ["solo", "2-5", "6-20", "20+"];
const WORK_TYPE_OPTIONS = ["reactive", "maintenance", "installations", "mixed"];
const STATUS_OPTIONS = ["in_progress", "completed", "declined", "abandoned"];

export default async function AdminInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ teamSizeBand?: string; workType?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const interviews = await listInterviews(filters);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Interviews ({interviews.length})</h1>
        <Link href="/admin" className="text-sm text-zinc-400 underline">
          ← Overview
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3 text-sm">
        <select name="teamSizeBand" defaultValue={filters.teamSizeBand ?? ""} className="rounded-lg border border-zinc-300 px-2 py-1.5">
          <option value="">All team sizes</option>
          {TEAM_SIZE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select name="workType" defaultValue={filters.workType ?? ""} className="rounded-lg border border-zinc-300 px-2 py-1.5">
          <option value="">All work types</option>
          {WORK_TYPE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className="rounded-lg border border-zinc-300 px-2 py-1.5">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v.replace("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white">
          Filter
        </button>
      </form>

      <div className="flex flex-col divide-y divide-zinc-200 rounded-xl bg-white shadow-sm">
        {interviews.length === 0 && <p className="p-4 text-sm text-zinc-500">No interviews match those filters.</p>}
        {interviews.map((i) => (
          <Link key={i.id} href={`/admin/interviews/${i.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50">
            <div>
              <div className="text-sm font-medium text-zinc-900">
                {i.participant_first_name ?? "(no name yet)"}
                {i.participant_business_name ? ` · ${i.participant_business_name}` : ""}
              </div>
              <div className="text-xs text-zinc-500">
                {i.team_size_band ?? "—"} · {i.work_type ?? "—"} · started {new Date(i.started_at).toLocaleDateString()}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{i.status.replace("_", " ")}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
