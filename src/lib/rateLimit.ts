// Simple per-identifier rate limiter held in memory. On Vercel that means
// per-function-instance — fine for a small resident app, since the only
// realistic abuse is one bored person spamming the form. If usage grows
// or you start seeing real abuse, swap this for Upstash Redis.

type WindowState = { count: number; resetAt: number };
const buckets = new Map<string, WindowState>();

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetIn: number; // seconds until the window resets
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return {
      ok: true,
      remaining: config.limit - 1,
      resetIn: config.windowMs / 1000,
    };
  }
  if (existing.count >= config.limit) {
    return {
      ok: false,
      remaining: 0,
      resetIn: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: config.limit - existing.count,
    resetIn: Math.ceil((existing.resetAt - now) / 1000),
  };
}

// GC expired buckets so the Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
