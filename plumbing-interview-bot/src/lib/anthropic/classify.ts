import { z } from "zod";
import { getAnthropicClient, HAIKU_MODEL } from "./client";
import { buildProblemClassificationSystemPrompt, YES_NO_SYSTEM_PROMPT } from "./prompts";
import { PROBLEM_TAXONOMY, isProblemKey, type ProblemKey } from "@/lib/problemTaxonomy";
import { MAX_TOP_PROBLEMS } from "@/lib/questionBank";

const YesNoSchema = z.object({
  answer: z.enum(["yes", "no", "unclear"]),
});

/**
 * Classifies a free-text reply to a yes/no question. Returns null on
 * "unclear" or any failure — callers must re-ask rather than assume,
 * especially for consent, which must never be inferred.
 */
export async function classifyYesNo(replyText: string): Promise<boolean | null> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 50,
    system: YES_NO_SYSTEM_PROMPT,
    tools: [
      {
        name: "classify_yes_no",
        description: "Classify a reply as yes, no, or unclear.",
        input_schema: {
          type: "object",
          properties: { answer: { type: "string", enum: ["yes", "no", "unclear"] } },
          required: ["answer"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "classify_yes_no" },
    messages: [{ role: "user", content: `Reply: "${replyText}"` }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = YesNoSchema.safeParse(toolUse.input);
  if (!parsed.success || parsed.data.answer === "unclear") return null;
  return parsed.data.answer === "yes";
}

const TopProblemsSchema = z.object({
  problemKeys: z.array(z.string()),
});

const TAXONOMY_LINES = PROBLEM_TAXONOMY.filter((p) => p.key !== "other")
  .map((p) => `- ${p.key}: ${p.label}`)
  .join("\n");

/** Maps free text onto the fixed problem taxonomy. Returns [] if nothing matched clearly. */
export async function classifyTopProblems(freeText: string): Promise<ProblemKey[]> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 200,
    system: buildProblemClassificationSystemPrompt(TAXONOMY_LINES),
    tools: [
      {
        name: "classify_top_problems",
        description: "Return the matched problem category keys, most costly first.",
        input_schema: {
          type: "object",
          properties: {
            problemKeys: { type: "array", items: { type: "string" }, maxItems: MAX_TOP_PROBLEMS },
          },
          required: ["problemKeys"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "classify_top_problems" },
    messages: [{ role: "user", content: `Answer: "${freeText}"` }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const parsed = TopProblemsSchema.safeParse(toolUse.input);
  if (!parsed.success) return [];

  return parsed.data.problemKeys.filter(isProblemKey).slice(0, MAX_TOP_PROBLEMS);
}
