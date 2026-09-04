import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Fixed-window rate limit check + increment. Returns true if the call is
 * allowed (and records it), false if the key is over its limit for the
 * current window. Not atomic under concurrent requests for the same key —
 * acceptable at this project's scale (a research MVP, not public traffic).
 */
export async function checkRateLimit(key: string, windowSeconds: number, maxHits: number): Promise<boolean> {
  const db = getSupabaseAdmin();
  const windowStart = new Date(Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds * 1000).toISOString();

  const { data: existing, error: readError } = await db
    .from("rate_limit_hits")
    .select("count")
    .eq("key", key)
    .eq("window_start", windowStart)
    .maybeSingle();
  if (readError) {
    console.error("rate limit read failed, allowing request", readError);
    return true; // fail open — a broken rate limiter shouldn't take the interview down
  }

  if (!existing) {
    await db.from("rate_limit_hits").insert({ key, window_start: windowStart, count: 1 });
    return true;
  }

  if (existing.count >= maxHits) return false;

  await db
    .from("rate_limit_hits")
    .update({ count: existing.count + 1 })
    .eq("key", key)
    .eq("window_start", windowStart);
  return true;
}

interface HeaderReader {
  get(name: string): string | null;
}

/** Works with both a Route Handler's Request.headers and next/headers()'s ReadonlyHeaders. */
export function getClientIp(headers: HeaderReader): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
