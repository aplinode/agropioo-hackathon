"use client";

import { useState } from "react";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";

type NewPasswordFormProps = {
  /** Called after a valid new password is submitted — parent owns what follows. */
  onSuccess: () => void;
};

/* Step 3 of password recovery: new password + confirm password.
   Rules shown before typing; show/hide toggles on both fields;
   inline errors for empty / too short / mismatch.
   Field problems use a deep-forest border + alert icon + ink text —
   this build stays greens + whites/neutrals. */
export default function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const errors: typeof fieldErrors = {};
    if (!password) errors.password = "Choose a new password.";
    else if (password.length < 8) errors.password = "Use at least 8 characters.";
    // Mismatch only judged once both fields have content.
    if (!confirmPassword) errors.confirmPassword = "Repeat your new password.";
    else if (password && confirmPassword !== password)
      errors.confirmPassword = "Passwords do not match.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo update. Swap for POST /api/auth/reset-password once wired.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setStatus("idle");
    onSuccess();
  }

  const inputClass = (hasError?: string) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  const toggleClass =
    "absolute inset-y-0 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy";

  function fieldError(id: string, message?: string) {
    if (!message) return null;
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink">
        <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-forest" />
        {message}
      </p>
    );
  }

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
    <>
      <p className="eyebrow text-agro-canopy">Step 3 · Last step</p>
      <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
        Set A New Password
      </h1>
      <p className="mt-3 leading-relaxed text-agro-slate">
        Choose a password you haven&apos;t used here before.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <p className="flex items-start gap-2.5 rounded-xl border border-agro-sprout bg-agro-mint px-4 py-3 text-sm leading-relaxed text-agro-slate">
          <CheckIcon size={16} className="mt-0.5 shrink-0 text-agro-canopy" aria-hidden="true" />
          Your password needs <strong className="font-semibold text-agro-ink">at least 8 characters</strong>.
        </p>

        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-agro-ink">
            New password
          </label>
          <div className="relative mt-2">
            <input
              id="new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "new-password-error" : undefined}
              className={`${inputClass(fieldErrors.password)} pr-14`}
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
          {fieldError("new-password-error", fieldErrors.password)}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-agro-ink">
            Confirm password
          </label>
          <div className="relative mt-2">
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              className={`${inputClass(fieldErrors.confirmPassword)} pr-14`}
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
          {fieldError("confirm-password-error", fieldErrors.confirmPassword)}
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
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </>
  );
}
