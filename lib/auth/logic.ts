/* PURE auth decision logic — no DB, no request objects (vitest target, K12).
   Everything here is deterministic given its inputs (clock passed as `now`). */

import { createHash } from "node:crypto";
import { randomInt } from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000; // FR13: 10 minutes
export const CODE_MAX_WRONG = 5; // FR14: 5 wrong entries kill the code
export const PASS_MAX_WRONG_TOTAL = 10; // FR14: cumulative across resends
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 s, server-side authority

/** a***@gmail.com style mask for on-screen display. */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return `•••@${email}`;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return `${local[0]}•••${domain}`;
}

/** SHA-256 hex of the code — codes are stored hashed, never plaintext (K4). */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Cryptographically random 6-digit code (FR13). */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type CodeRowLike = {
  code_hash: string;
  wrong_count: number;
  created_at: string;
  consumed_at: string | null;
  dead_at: string | null;
  voided_at: string | null;
  expires_at: string;
};

export type CodeVerdict =
  | "none" // no outstanding code at all
  | "open" // live and checkable
  | "expired"
  | "dead" // killed by wrong entries
  | "voided"; // superseded by a newer code (last-code-wins)

function ms(iso: string | null): number | null {
  return iso === null ? null : Date.parse(iso);
}

/** Decides whether the newest code row for (purpose, email) may be checked. */
export function latestCodeVerdict(
  row: CodeRowLike | null,
  now: number,
): CodeVerdict {
  if (!row) return "none";
  if (row.consumed_at !== null) return "voided";
  if (row.voided_at !== null) return "voided";
  if (row.dead_at !== null) return "dead";
  const expires = ms(row.expires_at);
  if (expires === null || expires <= now) return "expired";
  return "open";
}

/** True when the candidate matches the stored hash. */
export function codeMatches(row: CodeRowLike, candidate: string): boolean {
  return row.code_hash === sha256Hex(candidate);
}

export type WrongEntryOutcome = {
  nextCodeWrongCount: number;
  codeNowDead: boolean;
  nextPassWrongTotal: number;
  passNowDead: boolean;
};

/** Pure accounting for ONE wrong entry against the newest code + its pass.
 * Per-code counter kills the current code at 5; the cumulative per-pass
 * counter kills the whole pass at 10 (FR14). */
export function applyWrongEntry(
  currentCodeWrongCount: number,
  currentPassWrongTotal: number,
): WrongEntryOutcome {
  const nextCodeWrongCount = currentCodeWrongCount + 1;
  const nextPassWrongTotal = currentPassWrongTotal + 1;
  return {
    nextCodeWrongCount,
    codeNowDead: nextCodeWrongCount >= CODE_MAX_WRONG,
    nextPassWrongTotal,
    passNowDead: nextPassWrongTotal >= PASS_MAX_WRONG_TOTAL,
  };
}

/** Server-side resend cooldown: measured against created_at of the newest
 * non-voided code for this purpose+email (plan: Resend cooldown). */
export function isResendInCooldown(
  newestCodeCreatedAt: string | null,
  now: number,
): boolean {
  if (!newestCodeCreatedAt) return false;
  const created = ms(newestCodeCreatedAt);
  if (created === null) return false;
  return now - created < RESEND_COOLDOWN_MS;
}

/** Login redirect decision (plan pin): every fresh login goes to /onboarding
 * until an onboarding-completed flag exists; flip here later in one place. */
export function decideLoginRedirect(): "/onboarding" {
  return "/onboarding";
}

export type SessionRowLike = {
  expires_at: string;
  revoked_at: string | null;
};

/** A session row grants access only while un-revoked and unexpired. */
export function sessionRowIsActive(
  row: SessionRowLike | null | undefined,
  now: number,
): boolean {
  if (!row) return false;
  if (row.revoked_at !== null) return false;
  const expires = ms(row.expires_at);
  return expires !== null && expires > now;
}
