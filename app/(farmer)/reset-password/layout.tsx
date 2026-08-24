import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { requireGuestPage } from "@/lib/auth/guards";
import { readValidPass } from "@/lib/auth/pass";

/* Signed-out-only (FR28) AND gated STRICTLY on a reset pass that has PASSED
   code verification â€” stage='code_verified' with a bound account (FR10/K3).
   Anything else ejects to /forgot-password. Gates live in this LAYOUT so
   redirects resolve before streaming begins. */
export default async function ResetPasswordLayout({ children }: { children: ReactNode }) {
  await requireGuestPage();

  const pass = await readValidPass("reset");
  if (!pass || pass.row.stage !== "code_verified" || !pass.row.account_id) {
    redirect("/forgot-password");
  }

  return <>{children}</>;
}

