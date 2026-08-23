import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readValidPass } from "@/lib/auth/pass";
import { maskEmail } from "@/lib/auth/logic";
import VerifyScreen from "./verify-screen";

export const metadata: Metadata = {
  title: "Verify your code — Agropioo",
};

/* Shared OTP ROUTE (plan K10): one screen for signup verification AND step 2
   of password recovery. The live pass cookie decides the context; no live
   verify/reset pass ⇒ neutral ejection to /login (FR7/FR11). */
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
  if (resetPass) {
    return (
      <VerifyScreen
        context="reset"
        maskedEmail={maskEmail(resetPass.claims.email)}
      />
    );
  }

  redirect("/login");
}
