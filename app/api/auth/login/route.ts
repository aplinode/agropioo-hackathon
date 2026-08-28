/* POST /api/auth/login — password-only sign-in (FR18). Unknown email runs a
   bcrypt compare against a fixed dummy hash so latency is comparable (K8),
   then the SAME generic 401 is returned for both failure causes. Correct
   credentials on an unverified account issue a fresh verify pass and hand
   off to /verify (FR19); verified accounts get a 7-day session pass. */

import { queryOne } from "@/lib/db";
import {
  errorResponse,
  jsonResponse,
  clientIp,
  readJsonBody,
} from "@/lib/http";
import { COPY } from "@/lib/auth/copy";
import { RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import {
  clearPassCookies,
  mintPass,
  setPassCookie,
} from "@/lib/auth/pass";
import { decideLoginRedirect } from "@/lib/auth/logic";
import { deliverCode, issueVerificationCode } from "@/lib/auth/code-flow";
import bcrypt from "bcryptjs";

/** Fixed hash of an unrelated secret string — never matches user input by
 * accident; exists purely to equalize timing for unknown emails (K8). */
const DUMMY_HASH = "$2b$10$gEVyLdwve7Sp00tYKm9tzueaS6qTARdH0tMp2ZV1kVtC/1ZOvEQOS";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
};

function invalidCredentials(): Response {
  return errorResponse("unauthorized", COPY.INVALID_CREDENTIALS, 401);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = loginSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return invalidCredentials();
    }
    const { email, password } = parsed.data;

    if (
      !hitLimiter(
        "login:ip",
        clientIp(request),
        RATE_RULES.loginIp.limit,
        RATE_RULES.loginIp.windowMs,
      ) ||
      !hitLimiter(
        "login:email",
        email,
        RATE_RULES.loginEmail.limit,
        RATE_RULES.loginEmail.windowMs,
      )
    ) {
      return errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429);
    }

    const user = await queryOne<UserRow>(
      `SELECT * FROM users WHERE lower(email) = lower($1)`,
      [email]
    );

    const passwordMatches = await bcrypt.compare(
      password,
      user?.password_hash ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      // Byte-identical body + comparable work for both causes (FR18/FR31).
      return invalidCredentials();
    }

    if (!user.email_verified) {
      // Verification gate AFTER credentials match (FR19): fresh pass + code.
      await clearPassCookies("reset");
      const code = await issueVerificationCode("verify", user.email, user.id);
      const pass = await mintPass("verify", {
        accountId: user.id,
        email: user.email,
      });
      await setPassCookie("verify", pass.token);
      const delivery = await deliverCode("verify", user.email, code);
      return jsonResponse({
        redirect: "/verify",
        ...(delivery.demoCode ? { demoCode: delivery.demoCode } : {}),
      });
    }

    const pass = await mintPass("session", {
      accountId: user.id,
      email: user.email,
    });
    await setPassCookie("session", pass.token);
    await clearPassCookies("verify", "reset");

    return jsonResponse({ redirect: decideLoginRedirect() });
  } catch (error) {
    console.error("[login]", error instanceof Error ? error.message : error);
    return errorResponse("server_error", COPY.SERVER_ERROR, 500);
  }
}
