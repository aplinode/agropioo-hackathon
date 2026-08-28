/* POST /api/auth/logout — revokes THIS session row server-side (a copied
   cookie afterwards is useless, FR21) and clears the cookie. Other devices'
   sessions are untouched. */

import { query } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { clearPassCookies, readValidPass } from "@/lib/auth/pass";

export async function POST(): Promise<Response> {
  try {
    const pass = await readValidPass("session");
    if (!pass) {
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }

    await query(
      `UPDATE sessions
       SET revoked_at = $1
       WHERE id = $2 AND revoked_at IS NULL`,
      [new Date().toISOString(), pass.claims.jti]
    );

    await clearPassCookies("session");
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("[logout]", error instanceof Error ? error.message : error);
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
