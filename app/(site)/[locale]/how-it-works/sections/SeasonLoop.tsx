import { localized } from "@/lib/i18n/localized";
import { getCurrentDictionary } from "@/lib/i18n/server";

const stepPos = [
  { n: "1", x: 220, y: 80, lx: 220, ly: 40, anchor: "middle" as const },
  { n: "2", x: 344, y: 170, lx: 396, ly: 175, anchor: "start" as const },
  { n: "3", x: 296, y: 315, lx: 296, ly: 372, anchor: "middle" as const },
  { n: "4", x: 144, y: 315, lx: 144, ly: 372, anchor: "middle" as const },
  { n: "5", x: 96, y: 170, lx: 44, ly: 175, anchor: "end" as const },
];

export default async function SeasonLoop() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  // Latin-only typographic tracking; letter-spacing breaks Arabic-script joining.
  const latinOnly = locale === "en";
  const stepSpacing = latinOnly ? "2.5" : undefined;
  const centerSpacing = latinOnly ? "3" : undefined;

  const loopSteps = [
    { ...stepPos[0], label: t("hiw.route.stop2").text },
    { ...stepPos[1], label: t("hiw.route.stop4").text },
    { ...stepPos[2], label: t("hiw.route.stop5").text },
    { ...stepPos[3], label: t("hiw.loop.stepLearn").text },
    { ...stepPos[4], label: t("hiw.loop.stepImprove").text },
  ];

  const loopBenefits = [
    { title: L("hiw.loop.benefit1Title"), description: L("hiw.loop.benefit1Desc") },
    { title: L("hiw.loop.benefit2Title"), description: L("hiw.loop.benefit2Desc") },
    { title: L("hiw.loop.benefit3Title"), description: L("hiw.loop.benefit3Desc") },
  ];

  return (
    <section
      id="loop"
      className="w-full border-t border-agro-clay/70 bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              05
            </span>
            {L("hiw.loop.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("hiw.loop.titleA")}
            <br />
            {L("hiw.loop.titleB")}
          </h2>
          <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
            {L("hiw.loop.body")}
          </p>

          <ul className="reveal mt-9 space-y-5">
            {loopBenefits.map((benefit, index) => (
              <li key={index} className="flex gap-4">
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
            aria-label={t("hiw.loop.diagramLabel").text}
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
                  letterSpacing={stepSpacing}
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
              letterSpacing={centerSpacing}
              fill="var(--color-agro-canopy)"
            >
              {t("hiw.loop.centerSeason").text.toUpperCase()}
            </text>
            <text
              x="220"
              y="222"
              textAnchor="middle"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="11"
              fontWeight="600"
              letterSpacing={centerSpacing}
              fill="var(--color-agro-canopy)"
            >
              {t("hiw.loop.centerLoop").text.toUpperCase()}
            </text>
          </svg>

          <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
            {L("hiw.loop.caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
