import type { Metadata } from "next";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password — Agropioo",
};

/* Step 3 of recovery. Access is server-gated in this folder's LAYOUT
   (reset pass @ code_verified); the page only renders the form. */
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
