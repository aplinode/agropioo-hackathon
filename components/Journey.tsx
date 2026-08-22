import {
  CompassIcon,
  MapPinIcon,
  MessageIcon,
  PencilIcon,
} from "./icons";

const steps = [
  {
    n: "01",
    title: "Add your farm",
    body: "Enter your location, crop, and basic farm information.",
    icon: MapPinIcon,
  },
  {
    n: "02",
    title: "Ask the AI",
    body: "Ask any farming question in a supported local language.",
    icon: MessageIcon,
  },
  {
    n: "03",
    title: "Get guidance",
    body: "Receive advice shaped by your farm, weather, and crop context.",
    icon: CompassIcon,
  },
  {
    n: "04",
    title: "Record activity",
    body: "Log irrigation, fertiliser, disease, and harvest as the season unfolds.",
    icon: PencilIcon,
  },
];

export function Journey() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 bg-agro-mint"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-agro-canopy">
            How it works
          </p>
          <h2
            id="journey-heading"
            className="display-heading mt-3 font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.12] text-agro-forest"
          >
            From question to harvest record.
          </h2>
          <p className="mt-4 leading-relaxed text-agro-slate">
            One simple cycle, repeated through the season — each pass makes the
            next one smarter.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n}>
              <div className="flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-semibold text-agro-leaf"
                >
                  {step.n}
                </span>
                <step.icon size={20} className="text-agro-canopy" />
              </div>
              <div aria-hidden="true" className="mt-4 h-px w-full bg-agro-sprout" />
              <h3 className="mt-5 font-semibold text-agro-forest">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-12 max-w-xl text-sm leading-relaxed text-agro-slate">
          Every recorded activity builds your farm&rsquo;s memory — and the next
          recommendation draws on it.
        </p>
      </div>
    </section>
  );
}
