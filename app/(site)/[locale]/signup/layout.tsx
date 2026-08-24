import type { ReactNode } from "react";
import { readValidPass } from "@/lib/auth/pass";
import MemberBounce from "@/components/auth/member-bounce";

export const dynamic = "force-dynamic";

/* Signed-out-only zone (FR28) — same pattern as login/layout: server-side
   DB-backed check, then a client bounce (server redirects are swallowed
   under the locale rewriter in this build). */
export default async function SignupLayout({ children }: { children: ReactNode }) {
  const pass = await readValidPass("session");
  if (pass) return <MemberBounce target="/dashboard" />;
  return <>{children}</>;
}
