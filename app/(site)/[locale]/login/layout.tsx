import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

/* Login page: always visible, no session check needed.
   If a session happens to be present (e.g. from missed cleanup),
   the user stays on login rather than being bounced, avoiding
   hydration mismatch after signout. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
