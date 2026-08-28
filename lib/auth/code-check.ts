/* Shared gate for checking a submitted 6-digit code (both purposes).
   Order matters (plan: Guard truth order): rate limits → live matching pass
   → Zod body → newest-code verdict → hash compare → wrong-entry accounting.
   Every rejection is the uniform error shape; nothing reveals WHICH check
   failed beyond the intentional generic copy. */

import { query, queryOne } from "@/lib/db";
import { errorResponse, clientIp, readJsonBody } from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import {
  applyWrongEntry,
  codeMatches,
  latestCodeVerdict,
  type CodeRowLike,
} from "@/lib/auth/logic";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { readValidPass, type PassStateRow } from "@/lib/auth/pass";
import { codeSchema } from "@/lib/validation/auth";

export type CheckedCodeRow = CodeRowLike & { id: string };

export type CodeCheckResult =
  | { ok: false; response: Response }
  | { ok: true; email: string; jti: string; row: CheckedCodeRow };

function unauthorized(message: string): Response {
  return errorResponse("unauthorized", message, 401);
}

async function loadNewestCode(
  purpose: "verify" | "reset",
  email: string,
): Promise<CheckedCodeRow | null> {
  return queryOne<CheckedCodeRow>(
    `SELECT * FROM verification_codes
     WHERE purpose = $1 AND email = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [purpose, email]
  );
}

/** Runs the full code-check gate; `request.body` is consumed here. */
export async function runCodeCheck(
  purpose: "verify" | "reset",
  request: Request,
): Promise<CodeCheckResult> {
  const ipLimitFailed = !hitLimiter(
    "code-check:ip",
    clientIp(request),
    RATE_RULES.codeCheckIp.limit,
    RATE_RULES.codeCheckIp.windowMs,
  );
  if (ipLimitFailed) {
    return {
      ok: false,
      response: errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429),
    };
  }

  const pass = await readValidPass(purpose);
  if (!pass) {
    // Missing/forged/expired/wrong-type/consumed pass — fatal for the UI,
    // which ejects on this message (stale-tab rule).
    return {
      ok: false,
      response: unauthorized(COPY.UNAUTHORIZED_GENERIC),
    };
  }
  const passRow: PassStateRow = pass.row;
  const jti = pass.claims.jti;

  const passLimitFailed = !hitLimiter(
    "code-check:pass",
    jti,
    RATE_RULES.codeCheckPass.limit,
    RATE_RULES.codeCheckPass.windowMs,
  );
  if (passLimitFailed) {
    return {
      ok: false,
      response: errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429),
    };
  }

  const parsed = codeSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse("validation_error", COPY.VALIDATION_FALLBACK, 400),
    };
  }

  const row = await loadNewestCode(purpose, pass.claims.email);
  if (latestCodeVerdict(row, Date.now()) !== "open") {
    // No live code: expired, dead, voided, consumed, or never issued.
    return { ok: false, response: unauthorized(COPY.CODE_REJECTED) };
  }
  const codeRow = row as CheckedCodeRow;

  if (!codeMatches(codeRow, parsed.data.code)) {
    const next = applyWrongEntry(codeRow.wrong_count, passRow.wrong_total);
    const nowIso = new Date().toISOString();
    await query(
      `UPDATE verification_codes
       SET wrong_count = $1, dead_at = COALESCE($2, dead_at)
       WHERE id = $3`,
      [next.nextCodeWrongCount, next.codeNowDead ? nowIso : null, codeRow.id]
    );
    await query(
      `UPDATE pass_states
       SET wrong_total = $1, dead_at = COALESCE($2, dead_at)
       WHERE jti = $3`,
      [next.nextPassWrongTotal, next.passNowDead ? nowIso : null, jti]
    );
    return { ok: false, response: unauthorized(COPY.CODE_REJECTED) };
  }

  return { ok: true, email: pass.claims.email, jti, row: codeRow };
}
