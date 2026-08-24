import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { readValidPass } from "@/lib/auth/pass";

/* Shared OTP gate (FR7/FR11): a live verify OR reset pass is required to
   reach the code screen. No live pass â‡’ neutral ejection to /login. The
   check lives in this LAYOUT so the redirect resolves before streaming. */
export default async function VerifyLayout({ children }: { children: ReactNode }) {
  const verifyPass = await readValidPass("verify");
  if (verifyPass) return <>{children}</>;

  const resetPass = await readValidPass("reset");
  if (resetPass) return <>{children}</>;

  redirect("/login");
}

