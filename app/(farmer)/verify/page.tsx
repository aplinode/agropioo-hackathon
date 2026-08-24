import type { Metadata } from "next";
import { readValidPass } from "@/lib/auth/pass";
import { maskEmail } from "@/lib/auth/logic";
import VerifyScreen from "./verify-screen";

export const metadata: Metadata = {
  title: "Verify your code — Agropioo",
};

/* Shared OTP ROUTE (plan K10): one screen for signup verification AND step 2
   of password recovery. Access is gated by the LAYOUT in this folder; here
   the live pass decides which context renders (signup first, then reset). */
export default async function VerifyPage() {
  const verifyPass = await readValidPass("verify");
  if (verifyPass) {
    return (
      <VerifyScreen
        context="signup"
        maskedEmail={maskEmail(verifyPass.claims.email)}
      />
    );
  }

  const resetPass = await readValidPass("reset");
  if (!resetPass) {
    // Layout already ejected pass-less visitors; this satisfies types only.
    return null;
  }
  return (
    <VerifyScreen
      context="reset"
      maskedEmail={maskEmail(resetPass.claims.email)}
    />
  );
}
