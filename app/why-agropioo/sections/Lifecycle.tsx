const advisorScope = [
  {
    title: "Irrigation timing",
    description: "Know when to water — and when to wait.",
  },
  {
    title: "Crop planning",
    description: "Choose crops and sowing windows suited to your land.",
  },
  {
    title: "Fertiliser & pesticide guidance",
    description: "The right input, at the right dose, at the right moment.",
  },
  {
    title: "Pest & disease support",
    description: "Spot problems early and act before they spread.",
  },
  {
    title: "Harvest timing",
    description: "Pick at the moment that protects yield and quality.",
  },
  {
    title: "Weather-aware recommendations",
    description: "Every advisory reads today's conditions first.",
  },
  {
    title: "Everyday questions",
    description: "Ask anything about your crop, any day of the season.",
  },
];

export default function Lifecycle() {
  return (
    <section
      id="guidance"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              What the advisor covers
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              Guidance for every decision in the cycle
            </h2>
            <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
              One advisor walks the whole crop lifecycle with you — from
              planning the season to bringing the harvest home.
            </p>
          </div>

          <ul className="lg:col-span-7">
            {advisorScope.map((item, index) => (
              <li
                key={item.title}
                className="reveal group flex items-start gap-5 border-b border-agro-sprout/80 py-6 transition-colors duration-300 last:border-b-0 sm:gap-7"
              >
                <span
                  className="mt-1 font-mono text-xs font-semibold tracking-widest text-agro-canopy/50 transition-colors duration-300 group-hover:text-agro-canopy"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink transition-colors duration-300 group-hover:text-agro-canopy sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 leading-relaxed text-agro-slate">
                    {item.description}
                  </p>
                </div>
                <span className="mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-agro-canopy ring-1 ring-agro-sprout transition-all duration-300 group-hover:bg-agro-canopy group-hover:text-white" aria-hidden="true">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
