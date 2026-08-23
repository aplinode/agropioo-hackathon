import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./reset-password-form";
import { readValidPass } from "@/lib/auth/pass";

export const metadata: Metadata = {
  title: "Set a new password — Agropioo",
};

/* Server-gated on a reset pass that has PASSED code verification
   (stage='code_verified', account bound — FR10). Anything else ejects to
   /forgot-password; signed-in visitors go to the dashboard like other auth
   pages (FR28). */
export default async function ResetPasswordPage() {
  await requireGuestPage();

  const pass = await readValidPass("reset");
  if (!pass || pass.row.stage !== "code_verified" || !pass.row.account_id) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm />;
}
