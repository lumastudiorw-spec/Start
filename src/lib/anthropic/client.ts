import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Server-only. Never import this from a Client Component. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Fast + cheap, used for in-conversation decisions (follow-ups, classification).
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

// Higher quality, used once per interview for the final summary (stage 11).
export const SONNET_MODEL = "claude-sonnet-5";
