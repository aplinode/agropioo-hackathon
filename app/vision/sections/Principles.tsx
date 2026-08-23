const commitments = [
  "Lead with the farmer's benefit, never the technology",
  "Every screen, every answer — in the farmer's language",
  "Readable under the midday sun, not just in an office",
  "Plain words a neighbour could explain to a neighbour",
  "Built for phones first — that is where farming lives now",
  "Motion and design that feel natural, never mechanical",
];

export default function Principles() {
  return (
    <section
      id="principles"
      className="w-full bg-agro-forest px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-sprout">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              Non-negotiables
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.9rem]">
              Promises we build by
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-sprout/85">
              Vision fails in the details. These commitments apply to every
              feature, every page, every release — starting today.
            </p>
          </div>

          <ul className="grid content-start gap-x-10 sm:grid-cols-2 lg:col-span-7">
            {commitments.map((commitment) => (
              <li
                key={commitment}
                className="reveal flex items-start gap-3.5 border-b border-agro-sprout/15 py-5 text-sm leading-relaxed text-white/90 sm:text-base"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {commitment}
              </li>
            ))}
          </ul>
        </div>

        <p className="reveal mt-14 flex items-center justify-center gap-4 border-t border-agro-sprout/15 pt-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-sprout/60">
          <span className="hidden h-px w-10 bg-agro-sprout/20 sm:inline-block" aria-hidden="true" />
          Soil and signal — growing together
          <span className="hidden h-px w-10 bg-agro-sprout/20 sm:inline-block" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
