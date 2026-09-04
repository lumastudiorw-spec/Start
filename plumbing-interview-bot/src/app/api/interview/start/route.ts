import { NextResponse } from "next/server";
import { startInterview } from "@/lib/interviewEngine";

export async function POST() {
  try {
    const { resumeToken, messages } = await startInterview();
    return NextResponse.json({
      resumeToken,
      messages: messages.map((m) => ({ role: m.role, content: m.content, questionId: m.question_id })),
    });
  } catch (err) {
    console.error("interview/start failed", err);
    return NextResponse.json({ error: "Could not start interview." }, { status: 500 });
  }
}
