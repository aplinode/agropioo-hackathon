/* POST /api/auth/reset/password — step 3 of recovery, gated STRICTLY by a
   reset pass whose row reached stage='code_verified' with a bound account
   (FR10/K3). Stores the new bcrypt hash, flips unverified → verified (FR26),
   voids outstanding reset codes/passes, kills ALL sessions of the account,
   and does NOT auto-login (founder decision). */

import { query } from "@/lib/db";
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { clearPassCookies, readValidPass } from "@/lib/auth/pass";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

export async function POST(request: Request): Promise<Response> {
  try {
    const pass = await readValidPass("reset");
    if (
      !pass ||
      pass.row.stage !== "code_verified" ||
      pass.row.account_id === null
    ) {
      // UI ejects to /forgot-password on this shape (FR10).
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }

    const parsed = resetPasswordSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse("validation_error", COPY.VALIDATION_FALLBACK, 400);
    }
    const accountId = pass.row.account_id;
    const email = pass.claims.email;

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);

    const nowIso = new Date().toISOString();

    // Old hash stays authoritative up to this write; no window where neither
    // works. Unverified accounts become verified — the code proved ownership.
    await query(
      `UPDATE users
       SET password_hash = $1, email_verified = true, updated_at = $2
       WHERE id = $3`,
      [passwordHash, nowIso, accountId]
    );

    // Void every outstanding reset code for this email (any state).
    await query(
      `UPDATE verification_codes
       SET voided_at = $1
       WHERE purpose = $2 AND lower(email) = lower($3)
         AND voided_at IS NULL
         AND consumed_at IS NULL`,
      [nowIso, "reset", email]
    );

    // Consume the reset pass so it can never set another password.
    await query(
      `UPDATE pass_states
       SET consumed_at = $1
       WHERE jti = $2 AND consumed_at IS NULL`,
      [nowIso, pass.claims.jti]
    );

    // Kill EVERY session — all devices must sign in again (FR26).
    await query(
      `DELETE FROM sessions WHERE account_id = $1`,
      [accountId]
    );

    await clearPassCookies("reset", "verify");
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(
      "[reset/password]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
