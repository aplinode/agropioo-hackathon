import type { ReactNode } from "react";
import { readValidPass } from "@/lib/auth/pass";
import MemberBounce from "@/components/auth/member-bounce";

export const dynamic = "force-dynamic";

/* Signed-out-only zone (FR28). This route is served through the locale
   rewriter, where this build swallows server-side redirect()s — so the
   DB-backed session check here renders a client bounce for members
   instead. Non-proxied auth routes keep plain server redirects. */
export default async function LoginLayout({ children }: { children: ReactNode }) {
  const pass = await readValidPass("session");
  if (pass) return <MemberBounce target="/dashboard" />;
  return <>{children}</>;
}
