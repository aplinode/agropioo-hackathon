"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

type VerifyStatus = "idle" | "loading" | "error" | "locked";

type OtpVerifyProps = {
  /** "signin" = first-login verification · "reset" = password-reset step */
  context: "signin" | "reset";
  /** Destination shown masked, e.g. a***@gmail.com */
  email: string;
  /** Called after the correct code is verified — parent owns the hand-off. */
  onVerified: () => void;
  /** Escape-hatch label, e.g. "Use a different account" or "Back". */
  escapeLabel: string;
  onEscape: () => void;
};

export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return `•••@${email}`;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return `${local[0]}•••${domain}`;
}

function formatCooldown(seconds: number): string {
  return `0:${String(seconds).padStart(2, "0")}`;
}

function generateDemoCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* Shared 6-digit verification screen (UI-only demo build).
   Used by first-login verification (context "signin") and as step 2 of
   password recovery (context "reset"). A labelled demo banner reveals the
   code so the flow can be walked without an inbox. */
export default function OtpVerify({
  context,
  email,
  onVerified,
  escapeLabel,
  onEscape,
}: OtpVerifyProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [demoCode, setDemoCode] = useState(() => "482913");
  const [resentNotice, setResentNotice] = useState(false);
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
  const maskedEmail = maskEmail(email);

  function focusBox(index: number) {
    const clamped = Math.min(Math.max(index, 0), CODE_LENGTH - 1);
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  }

  function clearBoxes(focusFirst: boolean) {
    setDigits(Array(CODE_LENGTH).fill(""));
    if (focusFirst) {
      requestAnimationFrame(() => focusBox(0));
    }
  }

  async function submitCode(candidate: string) {
    if (candidate.length !== CODE_LENGTH || status === "loading" || status === "locked") return;
    setStatus("loading");
    // Demo verification. Swap for the Route Handler call once wired.
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (candidate === demoCode) {
      onVerified();
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS) {
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
      void submitCode(next.join(""));
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
      void submitCode(next.join(""));
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
    void submitCode(code);
  }

  function handleResend() {
    if (cooldown > 0 || status === "loading") return;
    setDemoCode(generateDemoCode());
    setAttempts(0);
    setStatus("idle");
    setResentNotice(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearBoxes(true);
  }

  const heading = context === "signin" ? "Verify it’s you" : "Check your email";

  return (
    <div>
      <h1 className="display-heading font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
        {heading}
      </h1>
      <p className="mt-3 leading-relaxed text-agro-slate">
        {context === "signin"
          ? `We sent a 6-digit code to ${maskedEmail}. Enter it below to secure your sign-in.`
          : `We sent a 6-digit code to ${maskedEmail}. Enter it below to continue.`}
      </p>

      {/* Demo affordance — removable once real code delivery exists. */}
      <p className="mt-5 rounded-lg border border-dashed border-agro-earth bg-agro-stone px-4 py-2.5 font-mono text-xs tracking-wide text-agro-slate">
        DEMO ONLY · Verification code: <strong className="text-agro-ink">{demoCode}</strong> · no email is sent
      </p>

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
            className={`h-14 w-full min-w-0 max-w-14 rounded-lg border bg-white text-center font-mono text-xl text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 ${
              status === "error"
                ? "border-agro-error focus:border-agro-error focus:ring-agro-error/20"
                : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
            } ${status === "locked" ? "cursor-not-allowed opacity-60" : ""}`}
          />
        ))}
      </div>

      {/* Announcements */}
      <div className="min-h-12 mt-4" aria-live="polite">
        {status === "error" && (
          <p className="text-sm text-agro-error" role="alert">
            That code didn&apos;t match. Please try again. ({attemptsLeft}{" "}
            {attemptsLeft === 1 ? "attempt" : "attempts"} left)
          </p>
        )}
        {status === "locked" && (
          <p className="rounded-lg border border-agro-error/30 bg-red-50 px-4 py-3 text-sm text-agro-error" role="alert">
            Too many incorrect attempts. Request a new code below to continue.
          </p>
        )}
        {status !== "error" && status !== "locked" && resentNotice && (
          <p className="text-sm text-agro-canopy">A fresh code is on its way.</p>
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
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-5 text-center text-sm text-agro-slate">
        Didn&apos;t get the code?{" "}
        {cooldown > 0 ? (
          <span className="font-medium text-agro-cloud">
            Resend code in <span className="font-mono">{formatCooldown(cooldown)}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
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
