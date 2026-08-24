"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import AuthShell from "@/components/auth/auth-shell";
import Stepper from "@/components/auth/stepper";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { COPY } from "@/lib/auth/copy";

type ResetValues = z.output<typeof resetPasswordSchema>;

const brandPoints = [
  "Back into your farm in under a minute",
  "Verified by a 6-digit code",
  "Plain-language steps throughout",
];

/* Step 3 of password recovery. The page has already server-gated this route
   on a reset-verified pass; the form posts /api/auth/reset/password and the
   success screen offers Sign in — NO auto-login (FR25). */
export default function ResetPasswordForm() {
  const router = useRouter();
  const [updated, setUpdated] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetValues) {
    setServerError("");
    const response = await fetch("/api/auth/reset/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (response.ok) {
      setUpdated(true);
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    // A pass that isn't reset-verified is ejected to step 1 (FR10).
    if (payload.error?.message === COPY.UNAUTHORIZED_GENERIC) {
      router.replace("/forgot-password");
      return;
    }
    setServerError(payload.error?.message ?? COPY.SERVER_ERROR);
  }

  const inputClass = (hasError?: { message?: string }) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 pr-14 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError?.message
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  const toggleClass =
    "absolute inset-y-0 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy";

  function eyeIcon(show: boolean) {
    return show ? (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.758 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }

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
            <p className="eyebrow mt-6 text-agro-canopy">Step 3 · Last step</p>
            <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
              Set A New Password
            </h1>
            <p className="mt-3 leading-relaxed text-agro-slate">
              Choose a password you haven&apos;t used here before.
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
                <label htmlFor="new-password" className="block text-sm font-semibold text-agro-ink">
                  New password
                </label>
                <div className="relative mt-2">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "new-password-error" : undefined}
                    {...register("password")}
                    className={inputClass(errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={toggleClass}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide new password" : "Show new password"}
                  >
                    {eyeIcon(showPassword)}
                  </button>
                </div>
                {errors.password && (
                  <p id="new-password-error" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-agro-ink">
                  Confirm password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    {...register("confirmPassword")}
                    className={inputClass(errors.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={toggleClass}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {eyeIcon(showPassword)}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink">
                    {errors.confirmPassword.message}
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
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}
