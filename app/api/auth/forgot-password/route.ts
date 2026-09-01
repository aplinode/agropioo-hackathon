/* POST /api/auth/forgot-password — step 1 of recovery. EVERY well-formed
   submission receives a reset pass carrying ONLY the submitted email (K3)
   and the SAME generic response (FR10/FR23). Known emails additionally get
   a code; unknown ones get nothing — responses never differ in production. */

import { queryOne } from "@/lib/db";
import {
  errorResponse,
  jsonResponse,
  clientIp,
  readJsonBody,
} from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { forgotSchema } from "@/lib/validation/auth";
import { mintPass, setPassCookie } from "@/lib/auth/pass";
import { deliverCode, issueVerificationCode } from "@/lib/auth/code-flow";

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = forgotSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse("validation_error", COPY.VALIDATION_FALLBACK, 400);
    }
    const { email } = parsed.data;

    if (
      !hitLimiter(
        "forgot:ip",
        clientIp(request),
        RATE_RULES.forgotIp.limit,
        RATE_RULES.forgotIp.windowMs,
      ) ||
      !hitLimiter(
        "forgot:email",
        email,
        RATE_RULES.forgotEmail.limit,
        RATE_RULES.forgotEmail.windowMs,
      )
    ) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    const pass = await mintPass("reset", { email });
    await setPassCookie("reset", pass.token);

    const account = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [email]
    );

    if (account) {
      const code = await issueVerificationCode(
        "reset",
        email,
        account.id as string,
      );
      await deliverCode("reset", email, code);
    }

    return jsonResponse({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[forgot-password]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
