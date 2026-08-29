import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

function MiniTile({
  label,
  value,
  tone,
}: {
  label: React.ReactNode;
  value: string;
  tone: "leaf" | "info" | "wheat" | "canopy";
}) {
  const toneClass = {
    leaf: "text-agro-success",
    info: "text-agro-info",
    wheat: "text-agro-warning",
    canopy: "text-agro-canopy",
  }[tone];

  return (
    <div className="rounded-xl border border-agro-clay/70 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
      <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-agro-canopy">
        {label}
      </p>
      <p className={`mt-1 font-mono text-lg font-bold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

export default async function FeaturesHero({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  return (
    <section
      id="features-page"
      className="relative w-full overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-start text-left">
          <p className="eyebrow rise flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            {L("feat.hero.eyebrow")}
          </p>

          <h1
            className="display-heading rise mt-5 font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight text-agro-ink sm:text-6xl lg:text-[4rem]"
            style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
          >
            {L("feat.hero.titleLead")}{" "}
            <span className="text-agro-canopy">{L("feat.hero.titleAccent")}</span>
          </h1>

          <p
            className="rise mt-6 max-w-lg text-lg leading-relaxed text-agro-slate"
            style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
          >
            {L("feat.hero.subtitle")}
          </p>

          <div
            className="rise mt-9 flex flex-wrap items-center gap-4"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
          >
            <a
              href="#get-started"
              className="inline-flex h-12 w-44 cursor-pointer items-center justify-center rounded-lg bg-agro-canopy px-6 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 sm:w-auto"
            >
              {L("feat.hero.ctaPrimary")}
            </a>
            <Link
              href="/#journey"
              className="inline-flex h-12 w-44 cursor-pointer items-center justify-center rounded-lg border border-agro-sprout bg-white px-6 text-sm font-semibold whitespace-nowrap text-agro-forest shadow-sm transition-all duration-200 hover:border-agro-canopy hover:bg-agro-mint sm:w-auto"
            >
              {L("feat.hero.ctaSecondary")}
            </Link>
          </div>

          <p
            className="rise mt-9 flex items-center gap-2.5 text-xs text-agro-slate"
            style={{ "--rise-delay": "0.32s" } as React.CSSProperties}
          >
            <span className="font-mono tracking-wide">{L("feat.hero.builtFor")}</span>
            <span className="h-1 w-1 rounded-full bg-agro-leaf" aria-hidden="true" />
            <span>{L("feat.hero.productOf")}</span>
          </p>
        </div>

        {/* Feature stack collage */}
        <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
          <div
            className="rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-agro-mint via-agro-mint to-agro-sprout/50 p-6 ring-1 ring-agro-sprout sm:p-10"
            style={{ "--rise-delay": "0.2s" } as React.CSSProperties}
          >
            <svg
              viewBox="0 0 400 400"
              fill="none"
              aria-hidden="true"
              className="drift absolute -right-16 -top-16 h-72 w-72 text-agro-leaf/30"
            >
              <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 10" />
              <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.6" />
              <circle cx="200" cy="40" r="5" fill="var(--color-agro-leaf)" stroke="none" />
            </svg>

            <div className="relative grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniTile label={L("feat.hero.tile1Label")} value={t("feat.hero.tile1Value").text} tone="leaf" />
                <MiniTile label={L("feat.hero.tile2Label")} value={t("feat.hero.tile2Value").text} tone="wheat" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniTile label={L("feat.hero.tile3Label")} value={t("feat.hero.tile3Value").text} tone="canopy" />
                <MiniTile label={L("feat.hero.tile4Label")} value={t("feat.hero.tile4Value").text} tone="info" />
              </div>

              <div className="mt-1 flex items-center gap-3 rounded-xl border border-agro-sprout bg-white px-4 py-3.5 shadow-md">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold uppercase tracking-[0.14em] text-agro-canopy">
                    {L("feat.hero.voiceReady")}
                  </p>
                  <p className="truncate text-xs text-agro-slate">{L("feat.hero.voiceLangs")}</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-wide text-agro-forest ring-1 ring-agro-sprout">
                  <span className="h-1.5 w-1.5 rounded-full bg-agro-success" aria-hidden="true" />
                  {L("feat.hero.liveBadge")}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-agro-forest px-4 py-3 shadow-md">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-agro-sprout">
                  {L("feat.hero.smsLabel")}
                </p>
                <p className="font-mono text-xs font-bold text-white">
                  {L("feat.hero.smsMsg")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
