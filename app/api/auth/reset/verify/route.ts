/* POST /api/auth/reset/verify — same machinery as signup/verify with
   purpose='reset'. On success the CODE is consumed and the pass row is
   upgraded in place: account_id bound + stage flips to code_verified (K3).
   The reset pass itself stays live — only set-password consumes it. */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { runCodeCheck } from "@/lib/auth/code-check";

export async function POST(request: Request): Promise<Response> {
  try {
    const check = await runCodeCheck("reset", request);
    if (!check.ok) return check.response;

    await query(
      `UPDATE verification_codes
       SET consumed_at = $1
       WHERE id = $2 AND consumed_at IS NULL`,
      [new Date().toISOString(), check.row.id]
    );

    const account = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [check.email]
    );
    if (!account) {
      // Unknown-email passes carry no codes, so reaching here without an
      // account is impossible; guard stays for integrity.
      return errorResponse("unauthorized", COPY.CODE_REJECTED, 401);
    }

    await query(
      `UPDATE pass_states
       SET account_id = $1, stage = $2
       WHERE jti = $3`,
      [account.id, "code_verified", check.jti]
    );

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(
      "[reset/verify]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
