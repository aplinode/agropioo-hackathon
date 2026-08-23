/* POST /api/auth/logout — revokes THIS session row server-side (a copied
   cookie afterwards is useless, FR21) and clears the cookie. Other devices'
   sessions are untouched. */

import { getSupabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { clearPassCookies, readValidPass } from "@/lib/auth/pass";

export async function POST(): Promise<Response> {
  try {
    const pass = await readValidPass("session");
    if (!pass) {
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }

    const supabase = getSupabase();
    await supabase
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", pass.claims.jti)
      .is("revoked_at", null);

    await clearPassCookies("session");
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("[logout]", error instanceof Error ? error.message : error);
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
