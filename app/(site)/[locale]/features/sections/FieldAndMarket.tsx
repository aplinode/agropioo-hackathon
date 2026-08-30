import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

const ndviCells = [
  0.86, 0.78, 0.64, 0.82, 0.9, 0.71,
  0.74, 0.88, 0.55, 0.8, 0.76, 0.84,
  0.68, 0.6, 0.72, 0.87, 0.79, 0.66,
];

function ndviColor(v: number) {
  if (v >= 0.8) return "var(--color-agro-canopy)";
  if (v >= 0.7) return "var(--color-agro-leaf)";
  if (v >= 0.62) return "var(--color-agro-sprout)";
  return "var(--color-agro-clay)";
}

export default async function FieldAndMarket({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const ledger = [
    { key: "feat.field.rowInputs", value: "−18,400", tone: "text-agro-error" },
    { key: "feat.field.rowLabour", value: "−12,000", tone: "text-agro-error" },
    { key: "feat.field.rowIrrigation", value: "−4,600", tone: "text-agro-error" },
    { key: "feat.field.rowRevenue", value: "+61,500", tone: "text-agro-success" },
  ] as const;

  return (
    <section
      id="field-market"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("feat.field.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              {L("feat.field.headingA")}
              <br />
              {L("feat.field.headingB")}
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            {L("feat.field.sub")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {/* Satellite NDVI */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.field.ndviCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.field.ndviTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.field.ndviDesc")}
            </p>

            <div
              className="mt-6 flex-1 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label={t("feat.field.ndviMock").text}
            >
              <div className="grid grid-cols-6 gap-1">
                {ndviCells.map((v, i) => (
                  <span key={i} className="aspect-square rounded-[4px]" style={{ backgroundColor: ndviColor(v) }} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-agro-clay pt-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-agro-clay" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-agro-sprout" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-agro-leaf" />
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-agro-canopy" />
                </div>
                <p className="font-mono text-xs text-agro-slate">
                  {L("feat.field.weakZone")}
                </p>
              </div>
            </div>
          </article>

          {/* Mandi price predictor */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.field.priceCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.field.priceTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.field.priceDesc")}
            </p>

            <div
              className="mt-6 flex flex-1 flex-col justify-between rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label={t("feat.field.priceMock").text}
            >
              <svg viewBox="0 0 220 90" fill="none" className="h-24 w-full" aria-hidden="true">
                <path d="M4 74L32 66 60 70 88 56 116 60 144 44 172 40 216 18" stroke="var(--color-agro-canopy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 74L32 66 60 70 88 56 116 60 144 44 172 40 216 18V88H4z" fill="var(--color-agro-canopy)" opacity="0.08" />
                <circle cx="216" cy="18" r="4" fill="var(--color-agro-wheat)" />
              </svg>
              <div className="mt-3 flex items-center justify-between border-t border-agro-clay pt-3">
                <span className="font-mono text-xs text-agro-slate">{L("feat.field.wheatTrend")}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-agro-warning/15 px-2.5 py-1 font-mono text-xs font-bold text-agro-forest">
                  {L("feat.field.holdStock")}
                </span>
              </div>
            </div>
          </article>

          {/* Profit / loss */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.field.financeCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.field.financeTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.field.financeDesc")}
            </p>

            <ul
              className="mt-6 flex-1 divide-y divide-agro-clay/70 rounded-xl bg-agro-mint/60 px-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label={t("feat.field.ledgerMock").text}
            >
              {ledger.map((row) => (
                <li key={row.key} className="flex items-center justify-between py-3">
                  <span className="text-sm text-agro-slate">{L(row.key)}</span>
                  <span className={`font-mono text-sm font-bold ${row.tone}`}>
                    {row.value}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between py-3">
                <span className="font-mono text-xs uppercase tracking-wide text-agro-canopy">
                  {L("feat.field.netMargin")}
                </span>
                <span className="font-mono text-sm font-bold text-agro-success">
                  +42%
                </span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
