import { redirect } from "next/navigation";
import { startInterview } from "@/lib/interviewEngine";

export const dynamic = "force-dynamic";

export default async function NewInterviewPage() {
  const { resumeToken } = await startInterview();
  redirect(`/interview/${resumeToken}`);
}
