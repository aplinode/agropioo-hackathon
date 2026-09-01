/* Uniform HTTP response helpers for every Route Handler (constitution:
   failures are always `{ error: { code, message } }` with a proper status). */

export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "recommendation_exists"
  | "conflict"
  | "conflict_registered"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error"
  | "server_error";

export function errorBody(code: ApiErrorCode, message: string) {
  return { error: { code, message } };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
): Response {
  return Response.json(errorBody(code, message), { status });
}

/** Reads the caller IP for rate limiting. Falls back to a stable local key
 * when no proxy headers exist (direct dev access). Never trusted for auth. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real && real.trim()) return real.trim();
  return "local";
}

/** Parses a JSON request body; returns undefined when absent/malformed so the
 * Zod boundary turns it into the standard validation error. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

type ZodIssueLike = { path: (string | number | symbol)[]; message: string };

/** Flattens a ZodError-like issue list into `{ field: message }` for clients. */
export function fieldErrorsFrom(issues: ZodIssueLike[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Per-key fixed-window rate limiter (e.g. per IP per route).
 * In-memory, single-process — fine for Vercel serverless where each
 * instance handles a small slice of traffic. Returns ok=true if the
 * request is within the limit, ok=false if it should be rejected with 429.
 */
type RateLimitBucket = number;
const rateLimitBuckets: Map<string, RateLimitBucket> = new Map();
const RATE_LIMIT_MAX_KEYS = 5000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const bucketStart = Math.floor(now / windowMs) * windowMs;
  const fullKey = `${key}:${bucketStart}`;
  const entry = (rateLimitBuckets.get(fullKey) ?? 0) + 1;
  rateLimitBuckets.set(fullKey, entry);
  if (entry > limit) {
    const retryAfterSec = Math.ceil((bucketStart + windowMs - now) / 1000);
    return { ok: false, retryAfterSec };
  }
  if (rateLimitBuckets.size > RATE_LIMIT_MAX_KEYS) {
    const cutoff = now - 2 * windowMs;
    for (const k of rateLimitBuckets.keys()) {
      const ts = Number(k.split(":").pop());
      if (!Number.isFinite(ts) || ts < cutoff) rateLimitBuckets.delete(k);
    }
  }
  return { ok: true, remaining: Math.max(0, limit - entry) };
}

/** Test-only escape hatch to clear the in-memory rate-limit buckets between
 *  test cases. Not exported from any production module. */
export function __resetRateLimitBucketsForTests(): void {
  rateLimitBuckets.clear();
}
