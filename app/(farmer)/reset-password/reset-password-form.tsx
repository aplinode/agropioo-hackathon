"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import NewPasswordForm from "@/components/auth/new-password-form";
import Stepper from "@/components/auth/stepper";

const brandPoints = [
  "Back into your farm in under a minute",
  "Verified by a 6-digit code",
  "Plain-language steps throughout",
];

/* Direct-navigation surface for step 3 of password recovery.
   Demo mode: renders the form without earlier-step state. Production note:
   must guard against out-of-order access once real wiring exists. */
export default function ResetPasswordForm() {
  const [updated, setUpdated] = useState(false);

  return (
    <AuthShell
      brandHeadline={
        <>
          A New Key
          <br />
          For The Same Farm.
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
      {!updated && (
        <Link
          href="/login"
          className="mb-8 inline-flex h-11 w-fit items-center gap-2 rounded-md px-1 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
        >
          <span aria-hidden="true">←</span> Back to sign in
        </Link>
      )}

      <Stepper current={3} />

      <div className="mt-8 flex flex-1 flex-col">
        {updated ? (
          <div className="flex flex-1 flex-col justify-center py-10">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-agro-canopy text-white"
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
        ) : (
          <>
            <p className="mt-6 rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 font-mono text-xs tracking-wide text-agro-slate">
              DEMO MODE · opened directly, skipping earlier recovery steps
            </p>
            <div className="mt-6">
              <NewPasswordForm onSuccess={() => setUpdated(true)} />
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
