const steps = [
  {
    title: "Add your farm",
    description:
      "Enter your location, crop, and basic details to create a digital farm profile.",
  },
  {
    title: "Ask the AI",
    description:
      "Type or speak your question in the language you are most comfortable with.",
  },
  {
    title: "Get guidance",
    description:
      "Receive advice grounded in your crop, weather, location, and farm history.",
  },
  {
    title: "Record activity",
    description:
      "Log irrigation, fertiliser, pesticide, or disease with a few taps.",
  },
  {
    title: "Build history",
    description:
      "Every record makes future recommendations smarter and more relevant.",
  },
  {
    title: "Keep monitoring",
    description:
      "Review records and track progress through the whole season.",
  },
];

export default function FarmerJourney() {
  return (
    <section
      id="journey"
      className="relative w-full overflow-hidden bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      {/* Furrow contours along the base */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-agro-sprout/70"
        viewBox="0 0 1440 130"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 60C240 38 480 88 720 62C960 36 1200 82 1440 52" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 100C240 78 480 124 720 100C960 76 1200 118 1440 92" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      </svg>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal justify-center text-agro-canopy">
            How it works
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            One question starts the season
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            A simple path from your first question to a complete, intelligent
            farm history.
          </p>
        </div>

        <ol className="relative mx-auto mt-16 max-w-2xl">
          {/* The furrow rail */}
          <span
            className="absolute bottom-3 left-[1.375rem] top-3 w-px bg-gradient-to-b from-agro-canopy via-agro-leaf to-agro-forest"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <li key={step.title} className="reveal relative pb-9 last:pb-0">
              <div className="flex gap-5 sm:gap-7">
                <span className="z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-agro-canopy bg-white font-mono text-sm font-bold text-agro-canopy shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pt-1.5">
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-agro-slate">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
