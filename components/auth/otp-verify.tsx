"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, AlertTriangleIcon } from "@/components/icons";

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5; // cosmetic mirror of the server-side per-code cap
const RESEND_COOLDOWN_SECONDS = 60;

export type OtpSubmitResult =
  | { status: "ok" }
  | { status: "retry"; message?: string }
  | { status: "eject" };

export type OtpResendResult =
  | { status: "ok"; demoCode?: string }
  | { status: "retry"; message?: string }
  | { status: "eject" };

type OtpVerifyProps = {
  /** "signup" = email verification after sign-up · "reset" = password-reset step */
  context: "signup" | "reset";
  /** Destination shown masked, e.g. a•••@gmail.com */
  email: string;
  /** Checks the code against the real Route Handler; fatal results eject. */
  submitCode: (code: string) => Promise<OtpSubmitResult>;
  /** Requests a fresh code from the real resend endpoint. */
  resendCode: () => Promise<OtpResendResult>;
  /** Rendered ONLY when the FR17 demo gate produced it — never otherwise. */
  demoCode?: string;
  /** Called after the correct code is verified — parent owns the hand-off. */
  onVerified: () => void;
  /** Escape-hatch label, e.g. "Use a different account" or "Back". */
  escapeLabel: string;
  onEscape: () => void;
};

function formatCooldown(seconds: number): string {
  return `0:${String(seconds).padStart(2, "0")}`;
}

/* Shared 6-digit verification screen serving BOTH purposes (FR12): signup
   verification and step 2 of password recovery. Layout, inputs, and rules
   are identical; context copy and escape hatches switch per purpose.
   Greens + whites/neutrals only: wrong-code states lean on deep-forest
   borders, an alert icon, and words — never a second hue. */
export default function OtpVerify({
  context,
  email,
  submitCode,
  resendCode,
  demoCode,
  onVerified,
  escapeLabel,
  onEscape,
}: OtpVerifyProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "locked">("idle");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [bannerCode, setBannerCode] = useState<string | undefined>(demoCode);
  const [notice, setNotice] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join("");
  const isComplete = digits.every((digit) => digit !== "");
  const attemptsLeft = MAX_ATTEMPTS - attempts;

  function focusBox(index: number) {
    const clamped = Math.min(Math.max(index, 0), CODE_LENGTH - 1);
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  }

  function clearBoxes(focusFirst: boolean) {
    setDigits(Array(CODE_LENGTH).fill(""));
    setNotice(null);
    if (focusFirst) {
      requestAnimationFrame(() => focusBox(0));
    }
  }

  async function checkCode(candidate: string) {
    if (candidate.length !== CODE_LENGTH || status === "loading") return;
    setStatus("loading");
    const result = await submitCode(candidate);
    if (result.status === "ok") {
      onVerified();
      return;
    }
    if (result.status === "eject") return; // parent navigated away
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS || result.message === "dead") {
      setStatus("locked");
      return;
    }
    setStatus("error");
    clearBoxes(true);
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/[^0-9]/g, "");
    if (!clean) {
      setDigits((current) => current.map((digit, i) => (i === index ? "" : digit)));
      return;
    }
    const next = [...digits];
    next[index] = clean[clean.length - 1];
    setDigits(next);
    if (index < CODE_LENGTH - 1) {
      focusBox(index + 1);
    } else if (next.every((digit) => digit !== "")) {
      void checkCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const clean = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!clean) return;
    const next = Array(CODE_LENGTH)
      .fill("")
      .map((_, i) => clean[i] ?? "");
    setDigits(next);
    const filledCount = Math.min(clean.length, CODE_LENGTH);
    if (clean.length >= CODE_LENGTH) {
      void checkCode(next.join(""));
    } else {
      requestAnimationFrame(() => focusBox(filledCount));
    }
  }

  function handleVerifyClick() {
    if (!isComplete) {
      const firstEmpty = digits.findIndex((digit) => digit === "");
      focusBox(firstEmpty === -1 ? 0 : firstEmpty);
      return;
    }
    void checkCode(code);
  }

  async function handleResend() {
    if (cooldown > 0 || status === "loading") return;
    setStatus("loading");
    const result = await resendCode();
    if (result.status === "eject") return; // parent navigated away
    if (result.status === "retry") {
      setStatus("idle");
      setNotice(result.message ?? "Couldn’t send a new code yet — try again shortly.");
      return;
    }
    if (result.demoCode) setBannerCode(result.demoCode);
    setAttempts(0);
    setStatus("idle");
    setNotice("A fresh code is on its way.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearBoxes(true);
  }

  const heading = context === "signup" ? "Verify Your Email" : "Check Your Email";
  const eyebrow = context === "signup" ? "Email verification" : "Step 2 · Verification";

  return (
    <div>
      <p className="eyebrow text-agro-canopy">{eyebrow}</p>
      <h1 className="display-heading mt-3 font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
        {heading}
      </h1>
      <p className="mt-3 leading-relaxed text-agro-slate">
        We sent a 6-digit code to <strong className="font-semibold text-agro-ink">{email}</strong>.
        Enter it below to continue.
      </p>

      {/* Demo affordance — renders ONLY when the FR17 gate delivered a code. */}
      {bannerCode && (
        <p className="mt-5 rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 font-mono text-xs tracking-wide text-agro-slate">
          DEMO ONLY · Verification code: <strong className="text-agro-ink">{bannerCode}</strong> · no email was sent
        </p>
      )}

      <div
        className="mt-6 flex items-center justify-between gap-2 sm:gap-3"
        role="group"
        aria-label="6-digit verification code"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
            aria-invalid={status === "error"}
            disabled={status === "locked"}
            className={`focus-ring-none h-14 w-full min-w-0 max-w-14 rounded-xl border-2 bg-white text-center font-mono text-2xl text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
              status === "error"
                ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
                : status === "locked"
                  ? "cursor-not-allowed border-agro-sprout opacity-60"
                  : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
            }`}
          />
        ))}
      </div>

      {/* Announcements */}
      <div className="mt-4 min-h-12" aria-live="polite">
        {status === "error" && (
          <p
            className="flex items-start gap-2 rounded-xl border border-agro-forest/25 bg-agro-mint px-3.5 py-3 text-sm font-medium text-agro-forest"
            role="alert"
          >
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
            That code didn&apos;t match. Please try again. ({attemptsLeft}{" "}
            {attemptsLeft === 1 ? "attempt" : "attempts"} left)
          </p>
        )}
        {status === "locked" && (
          <p
            className="flex items-start gap-2 rounded-xl bg-agro-forest px-4 py-3 text-sm font-medium text-white"
            role="alert"
          >
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-sprout" />
            Too many incorrect attempts. Request a new code below to continue.
          </p>
        )}
        {status !== "error" && status !== "locked" && notice && (
          <p className="text-sm text-agro-canopy">{notice}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleVerifyClick}
        disabled={status === "loading" || status === "locked"}
        aria-disabled={!isComplete || status === "locked"}
        className={`inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-agro-canopy active:translate-y-0 disabled:cursor-not-allowed ${
          isComplete && status !== "locked"
            ? "bg-agro-canopy text-white hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md"
            : "bg-agro-clay/60 text-agro-slate hover:-translate-y-0"
        }`}
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Verifying…
          </>
        ) : (
          <>
            Verify code
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>

      <p className="mt-5 text-center text-sm text-agro-slate">
        Didn&apos;t get the code?{" "}
        {cooldown > 0 ? (
          <span className="font-medium text-agro-slate">
            Resend code in <span className="font-mono">{formatCooldown(cooldown)}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void handleResend()}
            className="inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-md px-1 font-semibold text-agro-canopy underline-offset-4 transition-colors hover:text-agro-forest hover:underline"
          >
            Resend code
          </button>
        )}
      </p>

      <button
        type="button"
        onClick={onEscape}
        className="mt-6 inline-flex h-11 w-fit cursor-pointer items-center gap-2 self-center rounded-md px-2 text-sm font-medium text-agro-slate underline-offset-4 transition-colors hover:text-agro-canopy hover:underline"
      >
        <span aria-hidden="true">←</span> {escapeLabel}
      </button>
    </div>
  );
}
