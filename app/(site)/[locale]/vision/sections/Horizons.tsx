import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

const styleMap: Record<string, string> = {
  "panel-mint": "bg-agro-mint ring-1 ring-agro-sprout before:bg-agro-canopy",
  "panel-line": "border border-agro-clay/80 bg-white shadow-sm before:bg-agro-sprout",
  "panel-forest": "bg-agro-forest text-white shadow-lg before:bg-agro-leaf",
};

export default async function Horizons({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const horizons = [
    {
      tag: L("vp.horizons.h1Tag"),
      phase: L("vp.horizons.h1Phase"),
      status: L("vp.horizons.h1Status"),
      body: L("vp.horizons.h1Body"),
      points: [L("vp.horizons.h1P1"), L("vp.horizons.h1P2"), L("vp.horizons.h1P3")],
      style: "panel-mint",
    },
    {
      tag: L("vp.horizons.h2Tag"),
      phase: L("vp.horizons.h2Phase"),
      status: L("vp.horizons.h2Status"),
      body: L("vp.horizons.h2Body"),
      points: [L("vp.horizons.h2P1"), L("vp.horizons.h2P2"), L("vp.horizons.h2P3")],
      style: "panel-line",
    },
    {
      tag: L("vp.horizons.h3Tag"),
      phase: L("vp.horizons.h3Phase"),
      status: L("vp.horizons.h3Status"),
      body: L("vp.horizons.h3Body"),
      points: [L("vp.horizons.h3P1"), L("vp.horizons.h3P2"), L("vp.horizons.h3P3")],
      style: "panel-forest",
    },
  ];

  return (
    <section
      id="horizons"
      className="w-full border-t border-agro-clay/70 bg-agro-paper px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            {L("vp.horizons.eyebrow")}
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            {L("vp.horizons.heading")}
          </h2>
        </div>

        <div className="mt-14 space-y-4 lg:space-y-3">
          {horizons.map((horizon, index) => (
            <div key={index}>
              <article
                className={`reveal relative overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl before:absolute before:inset-y-0 before:left-0 before:w-1.5 sm:p-10 ${
                  styleMap[horizon.style]
                } ${index === 1 ? "lg:ml-14" : ""} ${index === 2 ? "lg:ml-28" : ""}`}
              >
                <div className="grid gap-8 pl-4 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-4">
                  <p
                    className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] ${
                      horizon.style === "panel-forest" ? "text-agro-sprout" : "text-agro-canopy"
                    }`}
                  >
                    {horizon.tag}
                  </p>
                  <h3 className="mt-2 flex flex-wrap items-baseline gap-x-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                    {horizon.phase}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 align-middle font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                        horizon.style === "panel-forest"
                          ? "border border-agro-sprout/40 bg-white/5 text-agro-sprout"
                          : "border border-agro-sprout bg-white text-agro-forest"
                      }`}
                    >
                      {horizon.status}
                    </span>
                  </h3>
                </div>

                <p
                  className={`leading-relaxed lg:col-span-5 ${
                    horizon.style === "panel-forest" ? "text-agro-sprout/85" : "text-agro-slate"
                  }`}
                >
                  {horizon.body}
                </p>

                <ul className="flex flex-col gap-2 lg:col-span-3">
                  {horizon.points.map((point, pi) => (
                    <li
                      key={pi}
                      className={`flex items-center gap-2.5 text-sm ${
                        horizon.style === "panel-forest" ? "text-white/90" : "text-agro-ink"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          horizon.style === "panel-forest" ? "bg-agro-leaf" : "bg-agro-canopy"
                        }`}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            {index < horizons.length - 1 && (
              <div
                className="flex items-center justify-center py-3 lg:justify-start"
                aria-hidden="true"
              >
                <span
                  className={`inline-flex h-9 w-9 rotate-90 items-center justify-center rounded-full border border-agro-sprout bg-white text-agro-canopy shadow-sm lg:ml-24 ${
                    index === 1 ? "lg:ml-40" : ""
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
