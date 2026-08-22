"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/references/logo.png";

type FormStatus = "idle" | "loading" | "error" | "success";

const platformPoints = [
  "AI advisor in your own language",
  "Satellite crop health monitoring",
  "Digital records for every season",
];

export default function LoginForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const errors: typeof fieldErrors = {};
    if (!email) errors.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo sign-in. Swap this block for:
    // const supabase = getSupabase();
    // const { error } = await supabase.auth.signInWithPassword({ email, password });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus("success");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-agro-forest text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full text-agro-sprout/15"
          viewBox="0 0 720 280"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 60C120 36 240 84 360 62C480 40 600 82 720 58" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 140C120 116 240 164 360 142C480 120 600 162 720 138" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 220C120 196 240 244 360 222C480 200 600 242 720 218" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 276C130 254 250 296 370 278C490 260 610 294 720 272" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        </svg>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src={logo} alt="Agropioo logo" width={44} height={44} className="h-11 w-11" />
            <span className="font-display text-3xl font-semibold tracking-tight">
              Agropioo
            </span>
          </Link>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-agro-sprout/80">
            A product of Aplinode
          </p>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-medium leading-[1.12] tracking-tight xl:text-[2.9rem]">
            Your farm&apos;s intelligence,
            <br />
            waiting where you left it.
          </h2>
          <ul className="mt-8 space-y-3">
            {platformPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-agro-sprout/90">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-agro-sprout/30"
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
        {/* Compact brand header for mobile */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src={logo} alt="Agropioo logo" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-2xl font-semibold tracking-tight text-agro-forest">
              Agropioo
            </span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14 lg:py-0">
          <Link
            href="/"
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-medium text-agro-canopy underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">←</span> Back to home
          </Link>

          <p className="eyebrow text-agro-canopy">Sign in</p>
          <h1 className="display-heading mt-3 font-display text-3xl font-medium tracking-tight text-agro-ink sm:text-4xl">
            Welcome back to the platform
          </h1>
          <p className="mt-3 leading-relaxed text-agro-slate">
            Sign in to reach your farm&apos;s advisor, records, and advisories.
          </p>

          {status === "error" && (
            <div
              className="mt-6 rounded-lg border border-agro-error/30 bg-red-50 px-4 py-3 text-sm text-agro-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {status === "success" ? (
            <div
              className="mt-8 flex items-center gap-3 rounded-xl border border-agro-sprout bg-agro-mint px-5 py-4"
              role="status"
            >
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white"
                aria-hidden="true"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-agro-ink">Signed in</p>
                <p className="text-sm text-agro-slate">
                  Your farm dashboard is on its way.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-agro-ink"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                  className={`mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-canopy/50 focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                      : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                  }`}
                />
                {fieldErrors.email && (
                  <p id="login-email-error" className="mt-1.5 text-sm text-agro-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-agro-ink"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                    className={`h-12 w-full rounded-lg border bg-white px-4 pr-20 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-canopy/50 focus:outline-none focus:ring-2 ${
                      fieldErrors.password
                        ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                        : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center rounded px-2 font-mono text-xs font-semibold uppercase tracking-wide text-agro-canopy transition-colors hover:text-agro-forest"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="login-password-error" className="mt-1.5 text-sm text-agro-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md focus-visible:outline-agro-canopy active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-sm leading-relaxed text-agro-slate">
            No account yet? Early access is rolling out region by region —{" "}
            <Link
              href="/#get-started"
              className="font-semibold text-agro-canopy underline-offset-4 hover:underline"
            >
              join the list
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
