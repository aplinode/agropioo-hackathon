/* POST /api/auth/reset/verify — same machinery as signup/verify with
   purpose='reset'. On success the CODE is consumed and the pass row is
   upgraded in place: account_id bound + stage flips to code_verified (K3).
   The reset pass itself stays live — only set-password consumes it. */

import { getSupabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { runCodeCheck } from "@/lib/auth/code-check";

export async function POST(request: Request): Promise<Response> {
  try {
    const check = await runCodeCheck("reset", request);
    if (!check.ok) return check.response;

    const supabase = getSupabase();
    await supabase
      .from("verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", check.row.id)
      .is("consumed_at", null);

    const { data: account } = await supabase
      .from("users")
      .select("id")
      .eq("email", check.email)
      .maybeSingle();
    if (!account) {
      // Unknown-email passes carry no codes, so reaching here without an
      // account is impossible; guard stays for integrity.
      return errorResponse("unauthorized", COPY.CODE_REJECTED, 401);
    }

    const { error } = await supabase
      .from("pass_states")
      .update({
        account_id: account.id as string,
        stage: "code_verified",
      })
      .eq("jti", check.jti);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(
      "[reset/verify]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
