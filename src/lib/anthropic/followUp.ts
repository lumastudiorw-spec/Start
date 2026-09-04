import { z } from "zod";
import { getAnthropicClient, HAIKU_MODEL } from "./client";
import { FOLLOW_UP_SYSTEM_PROMPT } from "./prompts";

const FollowUpDecisionSchema = z.object({
  shouldFollowUp: z.boolean(),
  followUpQuestion: z.string().nullable(),
  reasonTag: z
    .enum(["recurring_problem", "financial_time_cost", "vague_answer", "workaround_mentioned", "strong_sentiment"])
    .nullable(),
});

export type FollowUpDecision = z.infer<typeof FollowUpDecisionSchema>;

const NO_FOLLOW_UP: FollowUpDecision = { shouldFollowUp: false, followUpQuestion: null, reasonTag: null };

export async function decideFollowUp(params: {
  questionText: string;
  answerText: string;
  followUpsAlreadyAsked: number;
}): Promise<FollowUpDecision> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 300,
    system: FOLLOW_UP_SYSTEM_PROMPT,
    tools: [
      {
        name: "decide_follow_up",
        description: "Decide whether to ask a follow-up question after the participant's answer.",
        input_schema: {
          type: "object",
          properties: {
            shouldFollowUp: { type: "boolean" },
            followUpQuestion: {
              type: ["string", "null"],
              description: "Required if shouldFollowUp is true, otherwise null.",
            },
            reasonTag: {
              type: ["string", "null"],
              enum: ["recurring_problem", "financial_time_cost", "vague_answer", "workaround_mentioned", "strong_sentiment", null],
            },
          },
          required: ["shouldFollowUp", "followUpQuestion", "reasonTag"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "decide_follow_up" },
    messages: [
      {
        role: "user",
        content: `Fixed question asked: "${params.questionText}"\nParticipant's answer: "${params.answerText}"\nFollow-ups already asked on this question: ${params.followUpsAlreadyAsked}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NO_FOLLOW_UP;
  }

  const parsed = FollowUpDecisionSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NO_FOLLOW_UP;
  }

  // Defensive: never surface a follow-up with no actual question text.
  if (parsed.data.shouldFollowUp && !parsed.data.followUpQuestion?.trim()) {
    return NO_FOLLOW_UP;
  }

  return parsed.data;
}
