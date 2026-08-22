"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon } from "./icons";

type Status = "idle" | "error" | "success";

export function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div
        className="mx-auto flex max-w-md items-center justify-center gap-2.5 rounded-full border border-agro-sprout/40 bg-white/10 px-6 py-4 text-agro-wheat"
        role="status"
      >
        <CheckIcon size={18} />
        <span className="text-sm font-medium text-white">
          You&rsquo;re on the list — we&rsquo;ll be in touch.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-md">
      <label htmlFor="early-access-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="early-access-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@yourfarm.pk"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "early-access-error" : undefined}
          className={`h-12 min-w-0 flex-1 rounded-full border bg-white/10 px-5 text-sm text-white placeholder:text-white/50 transition-colors focus:outline-none ${
            status === "error"
              ? "border-agro-wheat"
              : "border-white/25 focus:border-agro-wheat"
          }`}
        />
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-agro-wheat px-6 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
        >
          Get early access
          <ArrowRightIcon size={18} />
        </button>
      </div>
      {status === "error" && (
        <p
          id="early-access-error"
          role="alert"
          className="mt-3 px-2 text-left text-xs font-medium text-agro-wheat"
        >
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
