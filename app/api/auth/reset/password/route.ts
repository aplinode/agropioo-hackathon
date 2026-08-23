/* POST /api/auth/reset/password — step 3 of recovery, gated STRICTLY by a
   reset pass whose row reached stage='code_verified' with a bound account
   (FR10/K3). Stores the new bcrypt hash, flips unverified → verified (FR26),
   voids outstanding reset codes/passes, kills ALL sessions of the account,
   and does NOT auto-login (founder decision). */

import { getSupabase } from "@/lib/supabase";
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

    const supabase = getSupabase();
    const nowIso = new Date().toISOString();

    // Old hash stays authoritative up to this write; no window where neither
    // works. Unverified accounts become verified — the code proved ownership.
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        email_verified: true,
        updated_at: nowIso,
      })
      .eq("id", accountId);
    if (updateError) throw updateError;

    // Void every outstanding reset code for this email (any state).
    await supabase
      .from("verification_codes")
      .update({ voided_at: nowIso })
      .match({ purpose: "reset", email })
      .is("voided_at", null)
      .is("consumed_at", null);

    // Consume the reset pass so it can never set another password.
    await supabase
      .from("pass_states")
      .update({ consumed_at: nowIso })
      .eq("jti", pass.claims.jti)
      .is("consumed_at", null);

    // Kill EVERY session — all devices must sign in again (FR26).
    await supabase.from("sessions").delete().eq("account_id", accountId);

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
