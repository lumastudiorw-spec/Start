import Link from "next/link";
import { getDashboardCounts } from "@/lib/db/adminQueries";

export const dynamic = "force-dynamic";

const TEAM_SIZE_TARGETS: Record<string, number> = { solo: 5, "2-5": 5, "6-20": 3 };

export default async function AdminOverviewPage() {
  const { totalByStatus, totalByTeamSize } = await getDashboardCounts();
  const total = Object.values(totalByStatus).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Research dashboard</h1>
        <a href="/admin/logout" className="text-sm text-zinc-400 underline">
          Log out
        </a>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["completed", "in_progress", "declined", "abandoned"] as const).map((status) => (
          <div key={status} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-2xl font-semibold text-zinc-900">{totalByStatus[status] ?? 0}</div>
            <div className="text-xs text-zinc-500">{status.replace("_", " ")}</div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-zinc-900">Sample vs. targets ({total} interviews total)</h2>
        <div className="flex flex-col gap-2">
          {Object.entries(TEAM_SIZE_TARGETS).map(([band, target]) => {
            const actual = totalByTeamSize[band] ?? 0;
            return (
              <div key={band} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-zinc-500">{band}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full bg-zinc-900"
                    style={{ width: `${Math.min(100, (actual / target) * 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-zinc-500">
                  {actual} / {target}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <Link href="/admin/interviews" className="text-sm font-medium text-zinc-900 underline">
        View all interviews →
      </Link>
    </main>
  );
}
