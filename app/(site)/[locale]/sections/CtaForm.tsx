"use client";

import { useState } from "react";

export interface CtaFormStrings {
  emailLabel: string;
  submit: string;
  success: string;
}

export default function CtaForm({ strings }: { strings: CtaFormStrings }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-xl border border-agro-sprout/40 bg-white/10 px-6 py-5"
        role="status"
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-sprout text-agro-forest" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <p className="text-left text-sm leading-relaxed text-white">
          {strings.success}
        </p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto mt-10 flex max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor="cta-email" className="sr-only">
        {strings.emailLabel}
      </label>
      <input
        id="cta-email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        dir="ltr"
        className="h-16 w-full flex-1 rounded-lg border border-agro-sprout/50 bg-white py-2 mb-1 px-4 text-base font-medium text-agro-ink shadow-md placeholder:font-normal placeholder:text-agro-cloud focus:border-agro-sprout focus:outline-none focus:ring-2 focus:ring-agro-sprout/60 sm:h-12"
      />
      <button
        type="submit"
        className="inline-flex h-11 cursor-pointer items-center justify-center self-center rounded-lg bg-white px-8 text-sm font-semibold whitespace-nowrap text-agro-forest shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-mint hover:shadow-lg active:translate-y-0 sm:h-12 sm:self-auto sm:px-7"
      >
        {strings.submit}
      </button>
    </form>
  );
}
