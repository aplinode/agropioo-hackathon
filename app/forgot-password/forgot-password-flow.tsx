"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import NewPasswordForm from "@/components/auth/new-password-form";
import OtpVerify from "@/components/auth/otp-verify";
import Stepper from "@/components/auth/stepper";

type Phase = "email" | "sent" | "verify" | "new-password" | "success";

const brandPoints = [
  "Back into your farm in under a minute",
  "Verified by a 6-digit code",
  "Plain-language steps throughout",
];

function stepForPhase(phase: Phase): 1 | 2 | 3 {
  if (phase === "email") return 1;
  if (phase === "sent" || phase === "verify") return 2;
  return 3;
}

export default function ForgotPasswordFlow() {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

  // Generic confirmation auto-advances to the shared verification screen.
  useEffect(() => {
    if (phase !== "sent") return;
    const timer = setTimeout(() => setPhase("verify"), 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const value = email.trim();
    const errors: typeof fieldErrors = {};
    if (!value) errors.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(value)) errors.email = "Enter a valid email address.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo request. Swap for POST /api/auth/forgot-password once wired.
    // The same neutral confirmation shows for every well-formed email —
    // never hinting whether an account exists.
    setTimeout(() => {
      setStatus("idle");
      setPhase("sent");
    }, 900);
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
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
          role="img"
          aria-label="Preview of the three recovery steps: your email, a 6-digit code, and a new password"
        >
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-sprout">
            Account recovery · three quick steps
          </p>
          <ul className="mt-3 divide-y divide-white/10">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/60">Step 1</span>
              <span className="font-mono text-sm font-semibold text-white">Your email</span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/60">Step 2</span>
              <span className="font-mono text-sm font-semibold text-white">6-digit code</span>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs uppercase tracking-wide text-white/60">Step 3</span>
              <span className="font-mono text-sm font-semibold text-white">New password</span>
            </li>
          </ul>
        </div>
      }
      brandPoints={brandPoints}
    >
      {phase !== "success" && (
        <Link
          href="/login"
          className="mb-8 inline-flex h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
        >
          <span aria-hidden="true">←</span> Back to sign in
        </Link>
      )}

      <Stepper current={stepForPhase(phase)} />

      <div className="mt-8 flex flex-1 flex-col">
        {phase === "email" && (
          <>
            <p className="eyebrow mt-6 text-agro-canopy">Password help</p>
            <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
              Reset Your Password
            </h1>
            <p className="mt-3 leading-relaxed text-agro-slate">
              Enter the email on your account and we&apos;ll send you a 6-digit
              verification code.
            </p>

            <form onSubmit={handleEmailSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="recovery-email" className="block text-sm font-semibold text-agro-ink">
                  Email address
                </label>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "recovery-email-error" : undefined}
                  className={`mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                      : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                  }`}
                />
                {fieldErrors.email && (
                  <p id="recovery-email-error" className="mt-1.5 text-sm text-agro-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending code…
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </form>
          </>
        )}

        {phase === "sent" && (
          <div className="flex flex-1 flex-col justify-center py-10" role="status">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-agro-mint text-agro-canopy"
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
              to <strong className="font-semibold text-agro-ink">{email}</strong>.
            </p>
            <p className="mt-2 text-sm text-agro-cloud">Taking you to the code…</p>
          </div>
        )}

        {phase === "verify" && (
          <OtpVerify
            context="reset"
            email={email}
            onVerified={() => setPhase("new-password")}
            escapeLabel="Back"
            onEscape={() => setPhase("email")}
          />
        )}

        {phase === "new-password" && (
          <NewPasswordForm onSuccess={() => setPhase("success")} />
        )}

        {phase === "success" && (
          <div className="flex flex-1 flex-col justify-center py-10">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-agro-canopy text-white"
              aria-hidden="true"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <h1 className="display-heading mt-6 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
              Password Updated
            </h1>
            <p className="mt-3 leading-relaxed text-agro-slate">
              Your password has been changed. Use it next time you sign in —
              your advisor, records, and advisories are waiting.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 sm:w-auto sm:px-10"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
