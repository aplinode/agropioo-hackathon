/* Server-side route protection (plan K6): one choke point per side.
   Pages: layouts call requireSessionPage() (guests → /login) or
   requireGuestPage() (signed-in → /dashboard, FR28). Handlers call
   requireSessionApi() and answer 401 with the uniform error shape. */

import { redirect } from "next/navigation";
import { readValidPass, type VerifiedPass } from "@/lib/auth/pass";
import { getAppLocale } from "@/lib/i18n/server";

export type SessionContext = {
  accountId: string;
  email: string;
};

function toSessionContext(pass: VerifiedPass): SessionContext {
  return { accountId: pass.claims.sub, email: pass.claims.email };
}

/** For protected pages/layouts. Redirects guests to /login (FR27/FR29). */
export async function requireSessionPage(): Promise<SessionContext> {
  const pass = await readValidPass("session");
  if (!pass) {
    const locale = await getAppLocale();
    redirect(`/${locale}/login`);
  }
  return toSessionContext(pass);
}

/** For auth pages (/login, /signup, /forgot-password, /reset-password).
 * Signed-in visitors are pushed to the dashboard immediately (FR28). */
export async function requireGuestPage(): Promise<void> {
  const pass = await readValidPass("session");
  if (pass) redirect("/dashboard");
}

/** For protected data APIs; null ⇒ handler returns the 401 shape. */
export async function requireSessionApi(): Promise<SessionContext | null> {
  const pass = await readValidPass("session");
  if (!pass) return null;
  return toSessionContext(pass);
}

/** For public pages that optionally adapt UI for signed-in visitors. */
export async function getSessionOptional(): Promise<SessionContext | null> {
  const pass = await readValidPass("session");
  if (!pass) return null;
  return toSessionContext(pass);
}
