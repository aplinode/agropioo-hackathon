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
