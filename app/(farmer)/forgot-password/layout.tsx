import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import { requireGuestPage } from "@/lib/auth/guards";

/* Signed-out-only zone (FR23/FR28): arriving with a valid session bounces
   straight to the dashboard, exactly like /login and /signup. */
export default async function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  await requireGuestPage();
  return <>{children}</>;
}

