/* POST /api/auth/signup/resend — fresh code for a live verify pass.
   60 s cooldown enforced SERVER-side against the newest non-voided code
   (plan: Resend cooldown); last-code-wins voiding happens at issuance. */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { isResendInCooldown } from "@/lib/auth/logic";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { readValidPass, type PassStateRow } from "@/lib/auth/pass";
import { deliverCode, issueVerificationCode } from "@/lib/auth/code-flow";

export async function POST(): Promise<Response> {
  try {
    const pass = await readValidPass("verify");
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

    // A pass that reached the cumulative cap dies like an expired one (FR14).
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
      ["verify", pass.claims.email]
    );

    if (isResendInCooldown(newest?.created_at ?? null, Date.now())) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    // Unknown email (defensive): stay neutral, send nothing.
    const account = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [pass.claims.email]
    );
    if (!account) {
      return jsonResponse({ ok: true });
    }

    const code = await issueVerificationCode(
      "verify",
      pass.claims.email,
      account.id as string,
    );
    void deliverCode("verify", pass.claims.email, code);
    return jsonResponse({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[signup/resend]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
