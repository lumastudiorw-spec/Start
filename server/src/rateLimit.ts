// Minimal in-memory sliding-window limiter — fine for a single instance,
// not distributed-safe if this is ever scaled to multiple processes.
const hits = new Map<string, number[]>()

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > max
}
