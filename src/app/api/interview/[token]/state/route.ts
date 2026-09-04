import { NextResponse } from "next/server";
import { getInterviewByResumeToken, getMessages } from "@/lib/db/interviews";
import { describeCurrentQuestion } from "@/lib/interviewStateMachine";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const found = await getInterviewByResumeToken(token);
  if (!found) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  const messages = await getMessages(found.interview.id);

  return NextResponse.json({
    status: found.interview.status,
    currentStep: found.interview.current_step,
    currentQuestion: describeCurrentQuestion(found.interview.state_json),
    messages: messages
      .filter((m) => !(m.role === "user" && m.skipped))
      .map((m) => ({ role: m.role, content: m.content, questionId: m.question_id })),
  });
}
