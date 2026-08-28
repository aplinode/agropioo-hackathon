/* POST /api/auth/signup/verify — checks the 6-digit code against a live
   verify pass. Success consumes code + pass (single-use, FR9), marks the
   account verified idempotently (race-safe), and clears pass cookies.
   Replay/stale-tab submissions fail the live-pass gate identically (FR11). */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { runCodeCheck } from "@/lib/auth/code-check";
import { clearPassCookies } from "@/lib/auth/pass";

export async function POST(request: Request): Promise<Response> {
  try {
    const check = await runCodeCheck("verify", request);
    if (!check.ok) return check.response;

    const nowIso = new Date().toISOString();

    // Consume the code; parallel double-submits both land here but only the
    // first flips consumed_at — both are treated as success (idempotent).
    await query(
      `UPDATE verification_codes
       SET consumed_at = $1
       WHERE id = $2 AND consumed_at IS NULL`,
      [nowIso, check.row.id]
    );

    const account = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [check.email]
    );
    if (!account) {
      return errorResponse("unauthorized", COPY.CODE_REJECTED, 401);
    }

    // Idempotent verification: setting true twice is harmless (plan note).
    await query(
      `UPDATE users
       SET email_verified = true, updated_at = $1
       WHERE id = $2`,
      [nowIso, account.id]
    );

    await query(
      `UPDATE pass_states
       SET consumed_at = $1
       WHERE jti = $2 AND consumed_at IS NULL`,
      [nowIso, check.jti]
    );

    await clearPassCookies("verify");
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(
      "[signup/verify]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
