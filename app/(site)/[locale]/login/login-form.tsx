"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { loginSchema } from "@/lib/validation/auth";
import { stashDemoCode } from "@/lib/auth/demo-code";
import { splitLocalePrefix } from "@/lib/i18n/logic";
import logoOnDark from "@/references/Agropioo-logo-footer.png";
import logoOnLight from "@/references/Agropioo-logo-withoutbg-text.png";

export type AuthErrorCopy = {
  emailRequired: string;
  emailInvalid: string;
  loginPasswordRequired: string;
  tooManyAttempts: string;
  invalidCredentials: string;
  serverError: string;
};

export type LoginCopy = {
  productOf: string;
  brandHeadingA: string;
  brandHeadingB: string;
  demoAria: string;
  demoUser: string;
  demoAdvisorLabel: string;
  demoAdvisorBody: string;
  points: [string, string, string];
  backHome: string;
  eyebrow: string;
  heading: string;
  sub: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  forgot: string;
  submit: string;
  submitting: string;
  noAccount: string;
  noAccountEnd: string;
  createAccount: string;
  footerStrip: string;
  errors: AuthErrorCopy;
};

type LoginValues = z.output<typeof loginSchema>;

/* Zod schemas are shared with the Route Handlers and speak English literals
   (plan K6/K11); this table maps each literal to its translated string. The
   English literal itself is the fallback when no entry matches. */
const ERROR_KEYS: Record<string, keyof Omit<AuthErrorCopy, "tooManyAttempts" | "invalidCredentials" | "serverError">> = {
  "Enter your email address.": "emailRequired",
  "Enter a valid email address.": "emailInvalid",
  "Enter your password.": "loginPasswordRequired",
};

export default function LoginForm({ copy }: { copy: LoginCopy }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { locale } = splitLocalePrefix(pathname);
  const prefix = locale ? `/${locale}` : "";
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const errorText = (message?: string) =>
    (message && ERROR_KEYS[message] ? copy.errors[ERROR_KEYS[message]] : message) ?? "";

  async function onSubmit(values: LoginValues) {
    setServerError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      redirect?: string;
      demoCode?: string;
      error?: { code?: string; message?: string };
    };

    if (response.ok && payload.redirect) {
      stashDemoCode(payload.demoCode);
      router.replace(payload.redirect);
      return;
    }
    if (payload.error?.code === "rate_limited") {
      setServerError(copy.errors.tooManyAttempts);
      return;
    }
    // Unknown email vs wrong password vs malformed body — ONE generic line.
    setServerError(copy.errors.invalidCredentials);
  }

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
          <Link href={prefix ? prefix : "/"} className="inline-flex items-center">
            <Image src={logoOnDark} alt="Agropioo" className="h-14 w-auto" />
          </Link>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-agro-sprout/80">
            {copy.productOf}
          </p>
        </div>

        <div className="relative max-w-md">
          <h2 className="display-heading font-display text-4xl font-bold leading-[1.25] tracking-tight xl:text-[2.9rem]">
            {copy.brandHeadingA}
            <br />
            {copy.brandHeadingB}
          </h2>

          <div
            className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
            role="img"
            aria-label={copy.demoAria}
          >
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-xl rounded-br-sm bg-agro-canopy px-3.5 py-2.5 text-sm leading-relaxed shadow-sm">
                {copy.demoUser}
              </p>
            </div>
            <div className="flex justify-start">
              <p className="max-w-[92%] rounded-xl rounded-bl-sm border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-white/90">
                <span className="font-semibold text-agro-sprout">{copy.demoAdvisorLabel}</span>{" "}
                {copy.demoAdvisorBody}
              </p>
            </div>
          </div>
          <ul className="mt-8 space-y-3">
            {copy.points.map((point) => (
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
          {copy.footerStrip}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-white px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
        {/* Compact brand header for mobile */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href={prefix ? prefix : "/"} className="inline-flex items-center">
            <Image src={logoOnLight} alt="Agropioo" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14 lg:py-0">
          <Link
            href={prefix ? prefix : "/"}
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
          >
            <span aria-hidden="true" data-flip-rtl>←</span> {copy.backHome}
          </Link>

          <p className="eyebrow text-agro-canopy">{copy.eyebrow}</p>
          <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            {copy.heading}
          </h1>
          <p className="mt-3 leading-relaxed text-agro-slate">{copy.sub}</p>

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
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-agro-ink"
              >
                {copy.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                {...register("email")}
                className={`mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                    : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                }`}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1.5 text-sm text-agro-error">
                  {errorText(errors.email.message)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-agro-ink"
              >
                {copy.passwordLabel}
              </label>
              <div className="relative mt-2">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  {...register("password")}
                  className={`h-12 w-full rounded-lg border bg-white px-4 pr-14 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                      : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
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
              {errors.password && (
                <p id="login-password-error" className="mt-1.5 text-sm text-agro-error">
                  {errorText(errors.password.message)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href={`${prefix}/forgot-password`}
                className="text-sm font-medium text-agro-canopy underline-offset-4 transition-colors hover:text-agro-forest hover:underline"
              >
                {copy.forgot}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md focus-visible:outline-agro-canopy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {copy.submitting}
                </>
              ) : (
                copy.submit
              )}
            </button>
          </form>

          <p className="mt-8 text-sm leading-relaxed text-agro-slate">
            {copy.noAccount}{" "}
            <Link
              href={`${prefix}/signup`}
              className="font-semibold text-agro-canopy underline-offset-4 hover:underline"
            >
              {copy.createAccount}
            </Link>
            {copy.noAccountEnd}
          </p>
        </div>
      </main>
    </div>
  );
}
