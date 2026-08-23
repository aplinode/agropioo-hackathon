const commitments = [
  {
    title: "Farmer benefit leads",
    description: "Every feature starts from the field's need — never from the technology.",
  },
  {
    title: "Language first",
    description: "Every screen and every answer arrives in the farmer's own language.",
  },
  {
    title: "Sunlight readable",
    description: "High contrast designed for the midday sun, not just the office.",
  },
  {
    title: "Plain words",
    description: "Simple enough that one neighbour can explain it to another.",
  },
  {
    title: "Phones before everything",
    description: "Mobile-first, big touch targets — farming lives on phones now.",
  },
  {
    title: "Natural by design",
    description: "Motion and layout that feel organic — growth, never machinery.",
  },
];

export default function Principles() {
  return (
    <section
      id="principles"
      className="w-full border-t border-agro-clay/70 bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
                <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
                Non-negotiables
              </p>
              <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
                Promises we build by
              </h2>
              <p className="reveal mt-5 max-w-sm leading-relaxed text-agro-slate">
                Vision fails in the details. These commitments apply to every
                feature, every page, every release — starting today.
              </p>
            </div>
          </div>

          <ul className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-8">
            {commitments.map((commitment, index) => (
              <li
                key={commitment.title}
                className={`reveal group rounded-2xl border border-agro-sprout/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:bg-white hover:shadow-xl ${
                  index % 2 === 0 ? "bg-white shadow-sm" : "bg-agro-mint/60 ring-1 ring-agro-sprout/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                    <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span
                    className="font-mono text-xs font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-agro-ink sm:text-lg">
                  {commitment.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-agro-slate">
                  {commitment.description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="reveal mt-16 flex items-center justify-center gap-4 border-t border-agro-clay/70 pt-10 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
          <span className="hidden h-px w-10 bg-agro-clay sm:inline-block" aria-hidden="true" />
          Soil and signal — growing together
          <span className="hidden h-px w-10 bg-agro-clay sm:inline-block" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
