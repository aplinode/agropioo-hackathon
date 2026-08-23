const beliefs = [
  {
    title: "Growth",
    description: "Living crops, healthy land, prosperous farmers.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5" />
      </svg>
    ),
  },
  {
    title: "Intelligence",
    description: "AI grounded in local weather, history, and crop science.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Accessibility",
    description: "Guidance in the farmer's own language and context.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
      </svg>
    ),
  },
  {
    title: "Trust",
    description: "Practical, timely advice that protects livelihoods.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Future",
    description: "Scalable technology that respects tradition.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
];

export default function Beliefs() {
  return (
    <section
      id="beliefs"
      className="w-full border-t border-agro-clay/70 bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            What we believe
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Five beliefs shape every decision
          </h2>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {beliefs.map((belief, index) => (
            <li
              key={belief.title}
              className={`reveal group relative rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-agro-canopy/50 hover:shadow-xl ${
                index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <span
                className="absolute right-5 top-5 font-mono text-xs font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                {belief.icon}
              </span>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink">
                {belief.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                {belief.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
