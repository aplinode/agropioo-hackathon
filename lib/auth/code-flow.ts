/* Shared code-issuance flow used by signup, login verification gate,
   forgot-password, and both resends. Encapsulates last-code-wins (FR13):
   issuing a new code instantly voids every earlier unconsumed, undead code
   for that (purpose, email). */

import { getSupabase } from "@/lib/supabase";
import { sendCode, type CodePurpose, type SendCodeResult } from "@/lib/mailer";
import { CODE_TTL_MS, generateCode, sha256Hex } from "@/lib/auth/logic";

/**
 * Voids outstanding codes for (purpose, email), stores a fresh SHA-256-hashed
 * code valid for 10 minutes (server clock), and returns its plaintext —
 * plaintext exists only in memory and the outgoing email.
 */
export async function issueVerificationCode(
  purpose: CodePurpose,
  email: string,
  accountId: string | null,
): Promise<string> {
  const supabase = getSupabase();

  await supabase
    .from("verification_codes")
    .update({ voided_at: new Date().toISOString() })
    .match({ purpose, email })
    .is("consumed_at", null)
    .is("dead_at", null)
    .is("voided_at", null);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const { error } = await supabase.from("verification_codes").insert({
    purpose,
    email,
    account_id: accountId,
    code_hash: sha256Hex(code),
    expires_at: expiresAt,
  });
  if (error) throw error;

  return code;
}

/** Sends the code through the FR17-gated mailer. */
export function deliverCode(
  purpose: CodePurpose,
  email: string,
  code: string,
): Promise<SendCodeResult> {
  return sendCode(purpose, email, code);
}
