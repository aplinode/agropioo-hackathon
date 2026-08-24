/* POST /api/auth/signup/resend — fresh code for a live verify pass.
   60 s cooldown enforced SERVER-side against the newest non-voided code
   (plan: Resend cooldown); last-code-wins voiding happens at issuance. */

import { getSupabase } from "@/lib/supabase";
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
      const supabase = getSupabase();
      await supabase
        .from("pass_states")
        .update({ dead_at: new Date().toISOString() })
        .eq("jti", pass.claims.jti);
      return errorResponse("unauthorized", COPY.UNAUTHORIZED_GENERIC, 401);
    }

    const supabase = getSupabase();
    const { data: newest } = await supabase
      .from("verification_codes")
      .select("*")
      .match({ purpose: "verify", email: pass.claims.email })
      .is("voided_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (isResendInCooldown(newest?.created_at ?? null, Date.now())) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    // Unknown email (defensive): stay neutral, send nothing.
    const { data: account } = await supabase
      .from("users")
      .select("id")
      .eq("email", pass.claims.email)
      .maybeSingle();
    if (!account) {
      return jsonResponse({ ok: true });
    }

    const code = await issueVerificationCode(
      "verify",
      pass.claims.email,
      account.id as string,
    );
    const delivery = await deliverCode("verify", pass.claims.email, code);
    return jsonResponse({
      ok: true,
      ...(delivery.demoCode ? { demoCode: delivery.demoCode } : {}),
    });
  } catch (error) {
    console.error(
      "[signup/resend]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
