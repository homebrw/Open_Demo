/**
 * In-memory sliding-window rate limiter, keyed by an arbitrary string
 * (typically `${route}:${ip}`).
 *
 * Deliberately not a distributed limiter: it lives in the memory of a single
 * serverless instance, so it resets on cold start and isn't shared across
 * concurrent instances. That's a real limitation, not a rate limit in the
 * strict sense — but it's a meaningful deterrent against a naive loop
 * hammering the API for free, at zero added infrastructure. A production-
 * grade guarantee would need a shared store (Vercel KV, Upstash, …), which
 * isn't something to add without being asked.
 */

const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
