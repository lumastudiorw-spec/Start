// Runs once, after an interview reaches "completed" (scheduled via
// next/server's after() so it never delays the participant's response).
// Reuses the same discipline as the other prompts: ground everything in
// the transcript, mark inference as inference, never invent.

import { z } from "zod";
import { getAnthropicClient, SONNET_MODEL } from "@/lib/anthropic/client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getInterviewDetail } from "@/lib/db/adminQueries";
import { PROBLEM_TAXONOMY, isProblemKey } from "@/lib/problemTaxonomy";

const SummarySchema = z.object({
  summaryText: z.string(),
  topProblems: z.array(
    z.object({
      problemKey: z.string(),
      rank: z.number().int().optional(),
      confidence: z.enum(["stated", "inferred"]),
    }),
  ),
  tags: z.array(z.string()),
  notableQuotes: z.array(z.object({ quoteText: z.string(), relatedProblemKey: z.string().nullable().optional() })),
});

const SYSTEM_PROMPT = `You are a research analyst summarising one completed interview with a UK plumbing-business owner about their admin problems.

Rules:
- Base every claim only on what the transcript actually shows. Never invent, assume, or embellish.
- Write summaryText in plain English, 150-250 words: who they are (role/team size/work type), their biggest admin problems and how costly or frequent they are, their reaction to the tool concept, and their level of commitment.
- For topProblems, use only a key from the taxonomy list given. Mark confidence "stated" if the participant said it directly, "inferred" if you're reading between the lines — when in doubt, prefer "inferred".
- notableQuotes must be exact verbatim substrings copied from the transcript, never a paraphrase.
- tags are short lowercase keywords useful for filtering later (e.g. "uses-whatsapp", "manual-quoting", "wants-pilot") — only ones clearly supported by the transcript.
Call the submit_summary tool with your answer. Always call it — never reply in plain text.`;

export async function generateAndStoreSummary(interviewId: string): Promise<void> {
  try {
    const detail = await getInterviewDetail(interviewId);
    if (!detail) return;

    const transcript = detail.messages
      .filter((m) => !m.skipped)
      .map((m) => `${m.role === "bot" ? "Interviewer" : "Participant"}: ${m.content}`)
      .join("\n");

    const taxonomyLines = PROBLEM_TAXONOMY.map((p) => `- ${p.key}: ${p.label}`).join("\n");

    const ratingLines = detail.problemRatings
      .map(
        (r) =>
          `- ${r.problem_key} (rank ${r.rank ?? "?"}): frequency=${r.frequency ?? "?"}, time_lost=${r.time_lost ?? "?"}, financial_consequence=${r.financial_consequence ?? "?"}`,
      )
      .join("\n");

    const userContent = `Problem taxonomy (use these keys only):
${taxonomyLines}

Screening: role=${detail.interview.role ?? "?"}, years=${detail.interview.years_experience ?? "?"}, team_size=${detail.interview.team_size_band ?? "?"}, work_type=${detail.interview.work_type ?? "?"}, tools=${detail.interview.current_tools?.join(", ") ?? "?"}

Structured problem ratings already captured (participant-stated, for reference):
${ratingLines || "(none captured)"}

Full transcript:
${transcript}`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "submit_summary",
          description: "Submit the structured interview summary.",
          input_schema: {
            type: "object",
            properties: {
              summaryText: { type: "string" },
              topProblems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    problemKey: { type: "string" },
                    rank: { type: "integer" },
                    confidence: { type: "string", enum: ["stated", "inferred"] },
                  },
                  required: ["problemKey", "confidence"],
                },
              },
              tags: { type: "array", items: { type: "string" } },
              notableQuotes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    quoteText: { type: "string" },
                    relatedProblemKey: { type: ["string", "null"] },
                  },
                  required: ["quoteText"],
                },
              },
            },
            required: ["summaryText", "topProblems", "tags", "notableQuotes"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_summary" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return;

    const parsed = SummarySchema.safeParse(toolUse.input);
    if (!parsed.success) {
      console.error("summary schema validation failed", parsed.error);
      return;
    }

    const db = getSupabaseAdmin();
    const validTopProblems = parsed.data.topProblems.filter((p) => isProblemKey(p.problemKey));

    await db.from("ai_summaries").insert({
      interview_id: interviewId,
      summary_text: parsed.data.summaryText,
      top_problems: validTopProblems,
      tags: parsed.data.tags,
    });

    const problemIdByKey = new Map<string, string>();
    if (parsed.data.notableQuotes.some((q) => q.relatedProblemKey)) {
      const { data: problems } = await db.from("problems").select("id, key");
      for (const p of problems ?? []) problemIdByKey.set(p.key, p.id);
    }

    if (parsed.data.notableQuotes.length > 0) {
      await db.from("notable_quotes").insert(
        parsed.data.notableQuotes.map((q) => ({
          interview_id: interviewId,
          quote_text: q.quoteText,
          related_problem_id: q.relatedProblemKey ? (problemIdByKey.get(q.relatedProblemKey) ?? null) : null,
        })),
      );
    }
  } catch (err) {
    console.error("summary generation failed", err);
  }
}
