"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import OtpVerify from "@/components/auth/otp-verify";
import { COPY } from "@/lib/auth/copy";

const brandPoints = [
  "One 6-digit code — that's all",
  "Your email stays yours alone",
  "Back on track in under a minute",
];

type VerifyContext = "signup" | "reset";

type VerifyScreenProps = {
  context: VerifyContext;
  maskedEmail: string;
};

export default function VerifyScreen({ context, maskedEmail }: VerifyScreenProps) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  function eject() {
    router.replace(context === "reset" ? "/forgot-password" : "/login");
  }

  async function postJson(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      // Empty body — treated as a server error below.
    }
    return { response, payload };
  }

  function classify(response: Response, payload: Record<string, unknown>) {
    if (response.ok && payload.error === undefined) return null;
    const error = payload.error as { code?: string; message?: string } | undefined;
    const message = error?.message ?? COPY.SERVER_ERROR;
    return message === COPY.UNAUTHORIZED_GENERIC ? "eject" : "retry";
  }

  async function submitCode(code: string) {
    const url =
      context === "signup" ? "/api/auth/signup/verify" : "/api/auth/reset/verify";
    const { response, payload } = await postJson(url, { code });
    if (response.ok) {
      setVerified(true);
      return { status: "ok" as const };
    }
    if (classify(response, payload) === "eject") {
      eject();
      return { status: "eject" as const };
    }
    return { status: "retry" as const, message: COPY.CODE_REJECTED };
  }

  async function resendCode() {
    const url =
      context === "signup" ? "/api/auth/signup/resend" : "/api/auth/reset/resend";
    const { response, payload } = await postJson(url);
    if (response.ok) {
      return { status: "ok" as const };
    }
    if (classify(response, payload) === "eject") {
      eject();
      return { status: "eject" as const };
    }
    const error = payload.error as { message?: string } | undefined;
    return {
      status: "retry" as const,
      message: error?.message ?? COPY.DELIVERY_FAILED,
    };
  }

  return (
    <AuthShell
      brandHeadline={
        context === "signup" ? (
          <>
            One Code
            <br />
            And You&apos;re In.
          </>
        ) : (
          <>
            Almost There —
            <br />
            Prove It&apos;s You.
          </>
        )
      }
      brandPreview={
        <div
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"
          role="img"
          aria-label="Preview of an emailed verification code arriving on a phone"
        >
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-sprout">
            {context === "signup" ? "Email verification · why it matters" : "Account recovery · step 2 of 3"}
          </p>
          <ul className="mt-3 divide-y divide-white/10">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/55">
                {context === "signup" ? "Protects your farm data" : "6-digit code"}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {context === "signup" ? "Only you can verify" : "Sent to your inbox"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/55">
                {context === "signup" ? "Expires safely" : "Next up"}
              </span>
              <span className="font-mono text-sm font-semibold text-white">
                {context === "signup" ? "10 minutes" : "Set a new password"}
              </span>
            </li>
          </ul>
        </div>
      }
      brandPoints={brandPoints}
    >
      {context === "reset" && (
        <Link
          href="/login"
          className="mb-8 inline-flex h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
        >
          <span aria-hidden="true" data-flip-rtl>←</span> Back to sign in
        </Link>
      )}

      {verified ? (
        <div className="flex flex-1 flex-col justify-center py-10" role="status">
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-agro-canopy text-white"
            aria-hidden="true"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <h1 className="display-heading mt-6 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            Email Verified
          </h1>
          <p className="mt-3 leading-relaxed text-agro-slate">
            Your account is confirmed and ready. Sign in to meet your farm&apos;s
            advisor and set up your first field.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 sm:w-auto sm:px-10"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <OtpVerify
            context={context}
            email={maskedEmail}
            submitCode={submitCode}
            resendCode={resendCode}
            escapeLabel={context === "reset" ? "Back to login" : "Use a different account"}
            onEscape={() => router.replace(context === "reset" ? "/login" : "/signup")}
            onVerified={() => {
              if (context === "reset") {
                router.replace("/reset-password");
              } else {
                setVerified(true);
              }
            }}
          />
      )}
    </AuthShell>
  );
}
