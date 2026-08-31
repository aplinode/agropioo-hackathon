/* Fixed-window rate limiter, dual-dimension (per-IP and per-account/email),
   in-process Map (plan K7). Deliberately simple for the single-instance demo;
   Redis is the noted next step in ADR 0003. Resets on redeploy/restart. */

type BucketState = { windowStart: number; count: number };

const buckets = new Map<string, BucketState>();

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

/** Pinned windows from the plan:
 * signup 5/h/IP + 5/h/email · login 10/15min/IP + 8/15min/email ·
 * forgot-password 3/h/IP + 3/h/email · resend 5/h/pass · code checks 20/h/IP + 30/h/pass */
export const RATE_RULES = {
  signupIp: { limit: 5, windowMs: HOUR_MS },
  signupEmail: { limit: 5, windowMs: HOUR_MS },
  loginIp: { limit: 10, windowMs: 15 * MINUTE_MS },
  loginEmail: { limit: 8, windowMs: 15 * MINUTE_MS },
  forgotIp: { limit: 3, windowMs: HOUR_MS },
  forgotEmail: { limit: 3, windowMs: HOUR_MS },
  resendPass: { limit: 5, windowMs: HOUR_MS },
  codeCheckIp: { limit: 20, windowMs: HOUR_MS },
  codeCheckPass: { limit: 30, windowMs: HOUR_MS },
  detectIp: { limit: 10, windowMs: HOUR_MS },
  cropsIp: { limit: 20, windowMs: HOUR_MS },
} as const;

/**
 * Records one hit against `scope:key` inside a fixed window.
 * Returns true when the request is ALLOWED, false once `limit` is exceeded.
 * `now` is injectable so tests can walk the clock deterministically.
 */
export function hitLimiter(
  scope: string,
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  const id = `${scope}:${key}`;
  let bucket = buckets.get(id);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(id, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Test-only: clear every bucket between suites. */
export function __resetRateLimitsForTests(): void {
  buckets.clear();
}
