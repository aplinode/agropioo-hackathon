const loopSteps = [
  { n: "1", label: "Ask", x: 220, y: 80, lx: 220, ly: 40, anchor: "middle" as const },
  { n: "2", label: "Act", x: 344, y: 170, lx: 396, ly: 175, anchor: "start" as const },
  { n: "3", label: "Record", x: 296, y: 315, lx: 296, ly: 372, anchor: "middle" as const },
  { n: "4", label: "Learn", x: 144, y: 315, lx: 144, ly: 372, anchor: "middle" as const },
  { n: "5", label: "Improve", x: 96, y: 170, lx: 44, ly: 175, anchor: "end" as const },
];

const loopBenefits = [
  {
    title: "Advice compounds",
    description:
      "Last season's disease, doses, and dates shape this season's first answer.",
  },
  {
    title: "Nothing gets repeated",
    description:
      "The advisor knows what was already sprayed or fed — no double dosing.",
  },
  {
    title: "Every season documented",
    description:
      "A clean history stays ready for loans, buyers, insurance, or the next crop decision.",
  },
];

export default function SeasonLoop() {
  return (
    <section
      id="loop"
      className="w-full border-t border-agro-clay/70 bg-agro-stone px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              05
            </span>
            The season loop
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            It doesn&apos;t end at harvest.
            <br />
            It starts there.
          </h2>
          <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
            Ask, act, record — repeat. Each turn of the loop feeds what the
            platform knows about your land, so the next season begins ahead of
            the last one.
          </p>

          <ul className="reveal mt-9 space-y-5">
            {loopBenefits.map((benefit, index) => (
              <li key={benefit.title} className="flex gap-4">
                <span className="font-mono text-sm font-semibold tracking-widest text-agro-canopy/50" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-agro-ink sm:text-lg">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-agro-slate">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Loop diagram */}
        <div className="reveal mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
          <svg
            viewBox="0 0 440 400"
            fill="none"
            role="img"
            aria-label="Circular loop diagram: ask, act, record, learn, improve"
            className="h-auto w-full"
          >
            <circle cx="220" cy="210" r="130" stroke="var(--color-agro-sprout)" strokeWidth="2" strokeDasharray="6 10" />

            {/* Directional chevrons */}
            {[36, 108, 180, 252, 324].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 220 210)`}>
                <path d="M213 66L224 74L213 82" stroke="var(--color-agro-canopy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}

            {/* Nodes */}
            {loopSteps.map((step) => (
              <g key={step.n}>
                <circle cx={step.x} cy={step.y} r="30" fill="var(--color-agro-paper)" stroke="var(--color-agro-canopy)" strokeWidth="2" />
                <text
                  x={step.x}
                  y={step.y + 5}
                  textAnchor="middle"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontSize="15"
                  fontWeight="700"
                  fill="var(--color-agro-canopy)"
                >
                  {String(step.n).padStart(2, "0")}
                </text>
                <text
                  x={step.lx}
                  y={step.ly}
                  textAnchor={step.anchor}
                  fontFamily="var(--font-geist-mono), monospace"
                  fontSize="12"
                  fontWeight="600"
                  letterSpacing="2.5"
                  fill="var(--color-agro-slate)"
                >
                  {step.label.toUpperCase()}
                </text>
              </g>
            ))}

            {/* Center */}
            <text
              x="220"
              y="202"
              textAnchor="middle"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="3"
              fill="var(--color-agro-canopy)"
            >
              SEASON
            </text>
            <text
              x="220"
              y="222"
              textAnchor="middle"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing="3"
              fill="var(--color-agro-canopy)"
            >
              LOOP
            </text>
          </svg>

          <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
            Har season, pichle se behtar
          </p>
        </div>
      </div>
    </section>
  );
}
