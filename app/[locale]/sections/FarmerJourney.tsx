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
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
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

        <ol className="mx-auto mt-16 max-w-2xl">
          {steps.map((step, index) => (
            <li key={step.title} className="reveal relative pb-10 last:pb-0">
              {index < steps.length - 1 && (
                <span
                  className="absolute bottom-0 left-[22px] top-12 w-px bg-agro-sprout"
                  aria-hidden="true"
                />
              )}
              <div className="flex gap-5 sm:gap-7">
                <span className="z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-agro-canopy bg-agro-mint font-mono text-sm font-bold text-agro-canopy">
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
