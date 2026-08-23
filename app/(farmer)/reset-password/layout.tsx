import type { ReactNode } from "react";
import { requireGuestPage } from "@/lib/auth/guards";

/* Signed-out-only zone (FR28). The stricter reset-verified-pass gate for
   the page itself lives in this folder's page.tsx (FR10). */
export default async function ResetPasswordLayout({ children }: { children: ReactNode }) {
  await requireGuestPage();
  return <>{children}</>;
}
