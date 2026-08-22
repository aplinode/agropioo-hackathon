const pakistanPoints = [
  "Local crop and climate knowledge",
  "Urdu, Punjabi, Saraiki, Pashto, Balochi, Hindko",
  "Refined through real farmer feedback",
];

const globalPoints = [
  "Country-specific agricultural knowledge",
  "Additional languages and local crops",
  "Deeper data integrations and analytics",
];

export default function Vision() {
  return (
    <section
      id="vision"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            The vision
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Built for Pakistan.
            <br />
            Ready for the world.
          </h2>
        </div>

        <div className="reveal mt-14 grid gap-5 lg:grid-cols-12">
          {/* Pakistan-first — the wider panel */}
          <article className="rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout sm:p-10 lg:col-span-7">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-agro-canopy text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              <h3 className="mt-5 font-display text-2xl font-medium tracking-tight text-agro-ink sm:text-[1.75rem]">
                Pakistan-first approach
              </h3>
              <p className="mt-3 max-w-xl leading-relaxed text-agro-slate">
                Version one is designed for Pakistan&apos;s fields: local crops,
                regional languages, real farming practices, real field
                conditions.
              </p>
              <ul className="mt-6 space-y-3">
                {pakistanPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-agro-ink sm:text-base">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Global — the dark counterpoint */}
          <article className="rounded-2xl bg-agro-forest p-7 text-white shadow-lg sm:p-10 lg:col-span-5">
            <div className="flex h-full flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-agro-sprout/30 bg-white/5 text-agro-sprout">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.236m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
              </span>
              <h3 className="mt-5 font-display text-2xl font-medium tracking-tight sm:text-[1.75rem]">
                Global expansion vision
              </h3>
              <p className="mt-3 leading-relaxed text-agro-sprout/80">
                Built to adapt. As the platform matures it scales to new
                countries, languages, crops, and climates — without rebuilding
                from scratch.
              </p>
              <ul className="mt-auto space-y-3 pt-8">
                {globalPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-white/90 sm:text-base">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-leaf" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
