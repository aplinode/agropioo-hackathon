"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import AuthShell from "@/components/auth/auth-shell";
import Stepper from "@/components/auth/stepper";
import { AlertTriangleIcon, ArrowRightIcon } from "@/components/icons";
import { forgotSchema } from "@/lib/validation/auth";
import { stashDemoCode } from "@/lib/auth/demo-code";

type ForgotValues = z.output<typeof forgotSchema>;

const brandPoints = [
  "Back into your farm in under a minute",
  "Verified by a 6-digit code",
  "Plain-language steps throughout",
];

/* Step 1 of password recovery ONLY (plan): posts the real API, shows the
   byte-stable generic confirmation, then hands off to the shared OTP route.
   Steps 2 and 3 live on /verify and /reset-password now. */
export default function ForgotPasswordFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<"email" | "sent">("email");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  // Generic confirmation auto-advances to the shared verification screen —
  // the same neutral copy for every well-formed email (FR23).
  useEffect(() => {
    if (phase !== "sent") return;
    const timer = setTimeout(() => router.replace("/verify"), 2200);
    return () => clearTimeout(timer);
  }, [phase, router]);

  async function onSubmit(values: ForgotValues) {
    setServerError("");
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      demoCode?: string;
      error?: { code?: string; message?: string };
    };

    if (response.ok && payload.ok) {
      stashDemoCode(payload.demoCode);
      setSubmittedEmail(values.email.trim());
      setPhase("sent");
      return;
    }
    if (payload.error?.code === "rate_limited") {
      setServerError(payload.error.message ?? "Too many attempts.");
      return;
    }
    setServerError(payload.error?.message ?? "Enter a valid email address.");
  }

  return (
    <AuthShell
      brandHeadline={
        <>
          Locked Out?
          <br />
          Back In, In Three Steps.
        </>
      }
      brandPreview={
        <div
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"
          role="img"
          aria-label="Preview of the three recovery steps: your email, a 6-digit code, and a new password"
        >
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-sprout">
            Account recovery · three quick steps
          </p>
          <ul className="mt-3 divide-y divide-white/10">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/55">Step 1</span>
              <span className="font-mono text-sm font-semibold text-white">Your email</span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/55">Step 2</span>
              <span className="font-mono text-sm font-semibold text-white">6-digit code</span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/55">Step 3</span>
              <span className="font-mono text-sm font-semibold text-white">New password</span>
            </li>
          </ul>
        </div>
      }
      brandPoints={brandPoints}
    >
      <Link
        href="/login"
        className="mb-8 inline-flex h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
      >
        <span aria-hidden="true" data-flip-rtl>←</span> Back to sign in
      </Link>

      <Stepper current={phase === "email" ? 1 : 2} />

      <div className="mt-8 flex flex-1 flex-col">
        {phase === "email" ? (
          <>
            <p className="eyebrow mt-6 text-agro-canopy">Password help</p>
            <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
              Reset Your Password
            </h1>
            <p className="mt-3 leading-relaxed text-agro-slate">
              Enter the email on your account and we&apos;ll send you a 6-digit
              verification code.
            </p>

            {serverError && (
              <div
                className="mt-6 rounded-lg border border-agro-error/30 bg-red-50 px-4 py-3 text-sm text-agro-error"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="recovery-email" className="block text-sm font-semibold text-agro-ink">
                  Email address
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "recovery-email-error" : undefined}
                  {...register("email")}
                  className={`focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
                      : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                  }`}
                />
                {errors.email && (
                  <p
                    id="recovery-email-error"
                    className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink"
                  >
                    <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-forest" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending code…
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRightIcon size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center py-10" role="status">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-agro-mint text-agro-canopy"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </span>
            <h1 className="display-heading mt-5 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
              Check Your Inbox
            </h1>
            <p className="mt-3 leading-relaxed text-agro-slate">
              If that email has an Agropioo account, a 6-digit code is on its way
              to <strong className="font-semibold text-agro-ink">{submittedEmail}</strong>.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-agro-cloud">
              Taking you to the code…
            </p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
