/* POST /api/auth/signup/verify — checks the 6-digit code against a live
   verify pass. Success consumes code + pass (single-use, FR9), marks the
   account verified idempotently (race-safe), and clears pass cookies.
   Replay/stale-tab submissions fail the live-pass gate identically (FR11). */

import { getSupabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { runCodeCheck } from "@/lib/auth/code-check";
import { clearPassCookies } from "@/lib/auth/pass";

export async function POST(request: Request): Promise<Response> {
  try {
    const check = await runCodeCheck("verify", request);
    if (!check.ok) return check.response;

    const supabase = getSupabase();
    const nowIso = new Date().toISOString();

    // Consume the code; parallel double-submits both land here but only the
    // first flips consumed_at — both are treated as success (idempotent).
    await supabase
      .from("verification_codes")
      .update({ consumed_at: nowIso })
      .eq("id", check.row.id)
      .is("consumed_at", null);

    const { data: account } = await supabase
      .from("users")
      .select("id")
      .eq("email", check.email)
      .maybeSingle();
    if (!account) {
      return errorResponse("unauthorized", COPY.CODE_REJECTED, 401);
    }

    // Idempotent verification: setting true twice is harmless (plan note).
    await supabase
      .from("users")
      .update({ email_verified: true, updated_at: nowIso })
      .eq("id", account.id);

    await supabase
      .from("pass_states")
      .update({ consumed_at: nowIso })
      .eq("jti", check.jti)
      .is("consumed_at", null);

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
