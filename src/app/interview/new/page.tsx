import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { startInterview } from "@/lib/interviewEngine";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export default async function NewInterviewPage() {
  const headerList = await headers();
  const allowed = await checkRateLimit(`start:${getClientIp(headerList)}`, 60 * 60, 10);

  if (!allowed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center">
        <p className="text-sm text-zinc-500">Too many interviews started from this connection — try again in a bit.</p>
      </main>
    );
  }

  const { resumeToken } = await startInterview();
  redirect(`/interview/${resumeToken}`);
}
