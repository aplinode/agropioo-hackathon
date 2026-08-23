const commitments = [
  {
    title: "Farmer benefit leads",
    description: "Every feature starts from the field's need — never from the technology.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Language first",
    description: "Every screen and every answer arrives in the farmer's own language.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: "Sunlight readable",
    description: "High contrast designed for the midday sun, not just the office.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Plain words",
    description: "Simple enough that one neighbour can explain it to another.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: "Phones before everything",
    description: "Mobile-first, big touch targets — farming lives on phones now.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    title: "Natural by design",
    description: "Motion and layout that feel organic — growth, never machinery.",
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 19.5C13 20.5 18.5 16 19.5 6.5 10.5 7.5 5.5 12.5 5.5 19.5zm0 0c0-4.5 2.8-8.3 7.5-11" />
      </svg>
    ),
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
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                    {commitment.icon}
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
