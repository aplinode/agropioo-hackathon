/* POST /api/auth/reset/resend — mirror of signup/resend for the reset
   purpose: live reset pass required, 60 s server-side cooldown, 5/h/pass. */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { isResendInCooldown } from "@/lib/auth/logic";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { readValidPass, type PassStateRow } from "@/lib/auth/pass";
import { deliverCode, issueVerificationCode } from "@/lib/auth/code-flow";

export async function POST(): Promise<Response> {
  try {
    const pass = await readValidPass("reset");
    if (!pass) {
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }
    const passRow: PassStateRow = pass.row;

    if (
      !hitLimiter(
        "resend:pass",
        pass.claims.jti,
        RATE_RULES.resendPass.limit,
        RATE_RULES.resendPass.windowMs,
      )
    ) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    if (passRow.wrong_total >= 10 || passRow.dead_at !== null) {
      await query(
        `UPDATE pass_states SET dead_at = $1 WHERE jti = $2`,
        [new Date().toISOString(), pass.claims.jti]
      );
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }

    const newest = await queryOne<{ created_at: string }>(
      `SELECT created_at FROM verification_codes
       WHERE purpose = $1 AND lower(email) = lower($2) AND voided_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      ["reset", pass.claims.email]
    );

    if (isResendInCooldown(newest?.created_at ?? null, Date.now())) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    const account = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [pass.claims.email]
    );
    if (!account) {
      // Unknown email: neutral ok, nothing sent — mirrors forgot-password.
      return jsonResponse({ ok: true });
    }

    const code = await issueVerificationCode(
      "reset",
      pass.claims.email,
      account.id as string,
    );
    void deliverCode("reset", pass.claims.email, code);
    return jsonResponse({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[reset/resend]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
