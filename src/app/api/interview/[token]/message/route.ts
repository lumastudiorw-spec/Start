import { NextResponse } from "next/server";
import { z } from "zod";
import { getInterviewByResumeToken } from "@/lib/db/interviews";
import { InterviewApiError, processAnswer } from "@/lib/interviewEngine";
import { describeCurrentQuestion } from "@/lib/interviewStateMachine";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const BodySchema = z.object({
  answer: z.string().max(4000).optional().default(""),
  skipped: z.boolean().optional().default(false),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [allowedByToken, allowedByIp] = await Promise.all([
    checkRateLimit(`message:token:${token}`, 10 * 60, 60),
    checkRateLimit(`message:ip:${getClientIp(request.headers)}`, 10 * 60, 150),
  ]);
  if (!allowedByToken || !allowedByIp) {
    return NextResponse.json({ error: "Slow down a moment and try again shortly." }, { status: 429 });
  }

  const parsedBody = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const found = await getInterviewByResumeToken(token);
  if (!found) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  try {
    const result = await processAnswer({
      participant: found.participant,
      interview: found.interview,
      answerText: parsedBody.data.answer,
      skipped: parsedBody.data.skipped,
    });

    return NextResponse.json({
      status: result.interview.status,
      currentStep: result.interview.current_step,
      currentQuestion: describeCurrentQuestion(result.interview.state_json),
      isTerminal: result.isTerminal,
      messages: result.newMessages.map((m) => ({ role: m.role, content: m.content, questionId: m.question_id })),
    });
  } catch (err) {
    if (err instanceof InterviewApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("interview/message failed", err);
    return NextResponse.json({ error: "Something went wrong processing that answer." }, { status: 500 });
  }
}
