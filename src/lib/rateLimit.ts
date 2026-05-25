// Rate limiter with two backends, chosen at runtime:
//   • Upstash Redis (shared across every serverless instance) when
//     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set. This is the
//     production path — limits hold across instances and survive cold starts,
//     so login brute-force and the public report form are actually throttled.
//   • In-memory fallback (per-instance) when Upstash isn't configured, so
//     local dev and preview deploys keep working without external services.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetIn: number; // seconds until the window resets
};

// ── Upstash (shared) backend ─────────────────────────────────────────────
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// One Ratelimit instance per distinct config, cached so connections/headers
// are reused across requests.
const limiters = new Map<string, Ratelimit>();
function upstashLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.limit}:${config.windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs} ms`),
      prefix: "ts_rl",
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// ── In-memory (per-instance) fallback ────────────────────────────────────
type WindowState = { count: number; resetAt: number };
const buckets = new Map<string, WindowState>();

function memoryRateLimit(
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

// GC expired buckets so the Map doesn't grow forever (memory backend only).
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

// ── Public API ───────────────────────────────────────────────────────────
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const res = await upstashLimiter(config).limit(identifier);
      const resetIn = Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));
      return { ok: res.success, remaining: res.remaining, resetIn };
    } catch (err) {
      // A Redis hiccup must never take down a request path — fall back to the
      // in-memory limiter for this call rather than throwing.
      console.error(
        "[rateLimit] Upstash error; using in-memory fallback:",
        err,
      );
      return memoryRateLimit(identifier, config);
    }
  }
  return memoryRateLimit(identifier, config);
}

// Best-effort client IP. Vercel sets x-vercel-forwarded-for (untamperable by
// the client); fall back to standard proxy headers in dev / other hosts.
export function getClientIp(req: Request): string {
  const h = req.headers;
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "anon";
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "anon";
  return h.get("x-real-ip") || "anon";
}
