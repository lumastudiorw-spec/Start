import { notFound } from "next/navigation";
import { getInterviewByResumeToken, getMessages } from "@/lib/db/interviews";
import { describeCurrentQuestion } from "@/lib/interviewStateMachine";
import InterviewChat from "@/components/InterviewChat";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ intro?: string }>;
}) {
  const { token } = await params;
  const { intro } = await searchParams;

  const found = await getInterviewByResumeToken(token);
  if (!found) notFound();

  const messages = await getMessages(found.interview.id);

  return (
    <InterviewChat
      token={token}
      status={found.interview.status}
      currentQuestion={describeCurrentQuestion(found.interview.state_json)}
      showIntro={intro === "1"}
      initialMessages={messages
        .filter((m) => !(m.role === "user" && m.skipped))
        .map((m) => ({ role: m.role, content: m.content, questionId: m.question_id }))}
    />
  );
}
