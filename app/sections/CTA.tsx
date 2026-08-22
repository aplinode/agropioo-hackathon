"use client";

import { useState } from "react";

export default function CTA() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      id="get-started"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow flex justify-center text-agro-sprout">
          Early access
        </p>
        <h2 className="display-heading mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
          Bring your farm onto the platform
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-agro-sprout/85">
          Join the farmers making better decisions with Agropioo — starting in
          Pakistan, growing worldwide.
        </p>

        {submitted ? (
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
              You&apos;re on the list. We&apos;ll be in touch when your
              region opens.
            </p>
          </div>
        ) : (
          <form
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label htmlFor="cta-email" className="sr-only">
              Email address
            </label>
            <input
              id="cta-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-lg border border-agro-sprout/50 bg-white px-4 text-base font-medium text-agro-ink shadow-md placeholder:font-normal placeholder:text-agro-cloud focus:border-agro-sprout focus:outline-none focus:ring-2 focus:ring-agro-sprout/60"
            />
            <button
              type="submit"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-white px-7 text-sm font-semibold text-agro-forest shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-mint hover:shadow-lg active:translate-y-0"
            >
              Get early access
            </button>
          </form>
        )}

        <p className="mt-4 font-mono text-xs tracking-wide text-agro-sprout/70">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
