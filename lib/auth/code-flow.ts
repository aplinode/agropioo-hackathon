/* Shared code-issuance flow used by signup, login verification gate,
   forgot-password, and both resends. Encapsulates last-code-wins (FR13):
   issuing a new code instantly voids every earlier unconsumed, undead code
   for that (purpose, email). */

import { query } from "@/lib/db";
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
  await query(
    `UPDATE verification_codes
     SET voided_at = $1
     WHERE purpose = $2 AND email = $3
       AND consumed_at IS NULL
       AND dead_at IS NULL
       AND voided_at IS NULL`,
    [new Date().toISOString(), purpose, email]
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await query(
    `INSERT INTO verification_codes (purpose, email, account_id, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [purpose, email, accountId, sha256Hex(code), expiresAt]
  );

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
