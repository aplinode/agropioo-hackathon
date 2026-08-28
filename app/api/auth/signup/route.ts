/* POST /api/auth/signup — first-write-wins account creation (K9) + fresh
   verify pass + code email. Duplicate VERIFIED email is the ONE explicit
   409 (FR2); duplicate UNVERIFIED re-runs verification with stored values. */

import { query, queryOne } from "@/lib/db";
import {
  errorResponse,
  jsonResponse,
  clientIp,
  readJsonBody,
} from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { signupSchema } from "@/lib/validation/auth";
import { mintPass, setPassCookie } from "@/lib/auth/pass";
import { deliverCode, issueVerificationCode } from "@/lib/auth/code-flow";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

type UserRow = {
  id: string;
  email: string;
  email_verified: boolean;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = signupSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse("validation_error", COPY.VALIDATION_FALLBACK, 400);
    }
    const { name, email, phone, password } = parsed.data;

    if (
      !hitLimiter(
        "signup:ip",
        clientIp(request),
        RATE_RULES.signupIp.limit,
        RATE_RULES.signupIp.windowMs,
      ) ||
      !hitLimiter(
        "signup:email",
        email,
        RATE_RULES.signupEmail.limit,
        RATE_RULES.signupEmail.windowMs,
      )
    ) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    // Existing account? Verified → explicit conflict. Unverified → reuse.
    let account = await queryOne<UserRow>(
      `SELECT * FROM users WHERE lower(email) = lower($1)`,
      [email]
    );

    if (account?.email_verified) {
      return errorResponse(
        "conflict_registered",
        COPY.EMAIL_ALREADY_REGISTERED,
        409,
      );
    }

    if (!account) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      try {
        account = await queryOne<UserRow>(
          `INSERT INTO users (email, full_name, phone, password_hash)
           VALUES (lower($1), $2, $3, $4)
           RETURNING *`,
          [email, name, phone, passwordHash]
        );
      } catch (insertError) {
        // Concurrent race on lower(email): exactly one insert wins; the loser
        // reuses the winning row's STORED data (first-write-wins, K9).
        const isUniqueViolation =
          insertError instanceof Error &&
          insertError.message.includes('duplicate key value violates unique constraint');
        if (isUniqueViolation) {
          account = await queryOne<UserRow>(
            `SELECT * FROM users WHERE lower(email) = lower($1)`,
            [email]
          );
          if (!account) {
            return errorResponse("server_error", COPY.SERVER_ERROR, 500);
          }
        } else {
          throw insertError;
        }
      }
    }

    // Fresh verification round for this account (new or pending).
    const code = await issueVerificationCode("verify", email, account.id);
    const pass = await mintPass("verify", { accountId: account.id, email });
    await setPassCookie("verify", pass.token);

    const delivery = await deliverCode("verify", email, code);
    return jsonResponse({
      ok: true,
      ...(delivery.demoCode ? { demoCode: delivery.demoCode } : {}),
    });
  } catch (error) {
    console.error("[signup]", error instanceof Error ? error.message : error);
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
