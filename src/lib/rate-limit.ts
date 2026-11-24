import "server-only";

/**
 * Simple in-memory sliding-window rate limiter for public form endpoints.
 * Per server instance (good enough to stop casual abuse on Vercel; the
 * honeypot + RLS consent check are the other layers). Swap for Upstash/Redis
 * if spam becomes a problem.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, { limit = 5, windowMs = 10 * 60_000 } = {}) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup so the map can't grow forever.
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true as const };
}

/**
 * Failure-only limiting (sign-in): check with `isLimited`, then `recordHit` only
 * when the attempt fails, so a busy office sharing one IP isn't locked out by its
 * own successful logins.
 */
export function isLimited(key: string, { limit = 5, windowMs = 10 * 60_000 } = {}): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  buckets.set(key, hits);
  return hits.length >= limit;
}

export function recordHit(key: string): void {
  const hits = buckets.get(key) ?? [];
  hits.push(Date.now());
  buckets.set(key, hits);
}

export function clearHits(key: string): void {
  buckets.delete(key);
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
