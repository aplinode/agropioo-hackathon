"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { signupSchema } from "@/lib/validation/auth";
import { COPY } from "@/lib/auth/copy";
import { stashDemoCode } from "@/lib/auth/demo-code";
import logoOnDark from "@/references/Agropioo-logo-footer.png";
import logoOnLight from "@/references/Agropioo-logo-withoutbg-text.png";

type SignupInput = z.input<typeof signupSchema>;
type SignupOutput = z.output<typeof signupSchema>;

const profileRows = [
  { label: "District", value: "Multan" },
  { label: "Crop", value: "Wheat · Rabi" },
  { label: "Advisory language", value: "Roman Urdu" },
];

const includedPoints = [
  "Personalised advisor from day one",
  "Weather-aware guidance for your district",
  "Farm records that sharpen every season",
];

function strengthOf(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score += 1;
  const labels = ["Too short", "Okay", "Good", "Strong"];
  return { score, label: labels[score] };
}

export default function SignupForm() {
  const router = useRouter();
  const [registered, setRegistered] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput, unknown, SignupOutput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const password = watch("password");
  const strength = useMemo(() => strengthOf(password ?? ""), [password]);

  async function onSubmit(values: SignupOutput) {
    setServerError("");
    const response = await fetch("/api/auth/signup", {
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
      router.replace("/verify");
      return;
    }
    if (payload.error?.code === "conflict_registered") {
      // The ONE explicit duplicate case (FR2).
      setRegistered(true);
      return;
    }
    if (payload.error?.code === "rate_limited") {
      setServerError(COPY.TOO_MANY_ATTEMPTS);
      return;
    }
    setServerError(payload.error?.message ?? COPY.SERVER_ERROR);
  }

  const inputClass = (hasError?: { message?: string }) =>
    `mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError?.message
        ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
        : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden gap-14 overflow-hidden bg-agro-forest text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <svg
          className="drift pointer-events-none absolute -right-48 -top-48 h-[30rem] w-[30rem] text-agro-sprout/20"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
          <circle cx="200" cy="200" r="136" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
          <circle cx="200" cy="40" r="5" fill="var(--color-agro-sprout)" stroke="none" />
        </svg>
        <svg
          className="pointer-events-none absolute -bottom-40 -left-40 h-[26rem] w-[26rem] text-agro-sprout/10"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
        </svg>

        <div className="relative">
          <Link href="/" className="inline-flex items-center">
            <Image src={logoOnDark} alt="Agropioo" className="h-14 w-auto" />
          </Link>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-agro-sprout/80">
            A product of Aplinode
          </p>
        </div>

        <div className="relative max-w-md">
          <h2 className="display-heading font-display text-4xl font-bold leading-[1.25] tracking-tight xl:text-[2.9rem]">
            Start Your Season
            <br />
            With Intelligence.
          </h2>

          <div
            className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
            role="img"
            aria-label="Preview of the farm profile created after sign up"
          >
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-sprout">
              Farm profile · ready in a minute
            </p>
            <ul className="mt-3 divide-y divide-white/10">
              {profileRows.map((row) => (
                <li key={row.label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="text-xs uppercase tracking-wide text-white/60">{row.label}</span>
                  <span className="font-mono text-sm font-semibold text-white">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-8 space-y-3">
            {includedPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-agro-sprout/90">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-canopy"
                  aria-hidden="true"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs uppercase tracking-[0.18em] text-agro-sprout/70">
          Built for Pakistan · Ready for the world
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-white px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex items-center">
            <Image src={logoOnLight} alt="Agropioo" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14 lg:py-0">
          <Link
            href="/"
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">←</span> Back to home
          </Link>

          <p className="eyebrow text-agro-canopy">Create account</p>
          <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            Bring Your Farm To Agropioo
          </h1>
          <p className="mt-3 leading-relaxed text-agro-slate">
            One account for your advisor, records, and every advisory this
            season.
          </p>

          {registered ? (
            /* Explicit registered-message block with working links (FR2). */
            <div
              className="mt-8 rounded-xl border border-agro-clay bg-agro-paper px-5 py-5"
              role="alert"
            >
              <p className="text-sm font-semibold text-agro-ink">
                This email is already registered.
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-agro-slate">
                Sign in instead, or reset your password if you&apos;ve forgotten
                it — your farm is waiting where you left it.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-agro-forest"
                >
                  Sign in
                </Link>
                <Link
                  href="/forgot-password"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-agro-clay px-5 text-sm font-semibold text-agro-canopy transition-colors hover:border-agro-canopy hover:bg-agro-mint"
                >
                  Reset password
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                  <label htmlFor="signup-name" className="block text-sm font-semibold text-agro-ink">
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Muhammad Ahmad"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "signup-name-error" : undefined}
                    {...register("name")}
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <p id="signup-name-error" className="mt-1.5 text-sm text-agro-error">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-semibold text-agro-ink">
                    Email address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "signup-email-error" : undefined}
                    {...register("email")}
                    className={inputClass(errors.email)}
                  />
                  {errors.email && (
                    <p id="signup-email-error" className="mt-1.5 text-sm text-agro-error">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-phone" className="block text-sm font-semibold text-agro-ink">
                    Phone number{" "}
                    <span className="font-normal text-agro-slate">(optional)</span>
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+92 3XX XXXXXXX"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "signup-phone-error" : undefined}
                    {...register("phone")}
                    className={inputClass(errors.phone)}
                  />
                  {errors.phone ? (
                    <p id="signup-phone-error" className="mt-1.5 text-sm text-agro-error">
                      {errors.phone.message}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-agro-slate">
                      For SMS alerts when you are offline.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold text-agro-ink">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby="signup-password-hint"
                      {...register("password")}
                      className={`${inputClass(errors.password)} pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.758 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3" aria-hidden="true">
                    <div className="flex flex-1 gap-1.5">
                      {[0, 1, 2].map((segment) => (
                        <span
                          key={segment}
                          className={`h-1 flex-1 rounded-full ${
                            password?.length === 0
                              ? "bg-agro-clay"
                              : segment < strength.score
                                ? "bg-agro-success"
                                : "bg-agro-clay"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="w-16 text-right font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">
                      {strength.label}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-agro-error">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-semibold text-agro-ink">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
                    {...register("confirmPassword")}
                    className={inputClass(errors.confirmPassword)}
                  />
                  {errors.confirmPassword && (
                    <p id="signup-confirm-error" className="mt-1.5 text-sm text-agro-error">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm text-agro-slate">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-agro-clay accent-agro-canopy"
                      aria-invalid={Boolean(errors.terms)}
                      {...register("terms")}
                    />
                    <span>
                      I agree to the{" "}
                      <a href="#" className="font-medium text-agro-canopy underline-offset-4 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="font-medium text-agro-canopy underline-offset-4 hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="mt-1.5 text-sm text-agro-error">{errors.terms.message}</p>
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
                      Creating account…
                    </>
                  ) : (
                    "Create my account"
                  )}
                </button>
              </form>
            </>
          )}

          {!registered && (
            <p className="mt-8 text-sm leading-relaxed text-agro-slate">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-agro-canopy underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
