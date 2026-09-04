import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Plumbing admin research</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        A quick chat about how you handle enquiries, quotes and admin. About 10 minutes, not a sales call.
      </p>
      <Link
        href="/interview/new"
        className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white"
      >
        Start
      </Link>
    </main>
  );
}
