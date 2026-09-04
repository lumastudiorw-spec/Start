import { NextResponse } from "next/server";
import { startInterview } from "@/lib/interviewEngine";
import { describeCurrentQuestion } from "@/lib/interviewStateMachine";

export async function POST() {
  try {
    const { resumeToken, interview, messages } = await startInterview();
    return NextResponse.json({
      resumeToken,
      currentQuestion: describeCurrentQuestion(interview.state_json),
      messages: messages.map((m) => ({ role: m.role, content: m.content, questionId: m.question_id })),
    });
  } catch (err) {
    console.error("interview/start failed", err);
    return NextResponse.json({ error: "Could not start interview." }, { status: 500 });
  }
}
