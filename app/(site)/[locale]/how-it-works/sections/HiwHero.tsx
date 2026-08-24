import Link from "next/link";
import { localized } from "@/lib/i18n/localized";
import { getCurrentDictionary } from "@/lib/i18n/server";

export default async function HiwHero() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const stops = [
    L("hiw.route.stop1"),
    L("hiw.route.stop2"),
    L("hiw.route.stop3"),
    L("hiw.route.stop4"),
    L("hiw.route.stop5"),
    L("hiw.route.stop6"),
  ];
  const stopTexts = [
    t("hiw.route.stop1").text,
    t("hiw.route.stop2").text,
    t("hiw.route.stop3").text,
    t("hiw.route.stop4").text,
    t("hiw.route.stop5").text,
    t("hiw.route.stop6").text,
  ];

  return (
    <section
      id="how-top"
      className="relative w-full overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow rise flex items-center justify-center gap-3 text-agro-canopy">
          <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
          {L("hiw.hero.eyebrow")}
          <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
        </p>

        <h1
          className="display-heading rise mt-5 font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight text-agro-ink sm:text-6xl"
          style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
        >
          {L("hiw.hero.titleA")}
          <br />
          {L("hiw.hero.titleLead")}{" "}
          <span className="text-agro-canopy">{L("hiw.hero.titleAccent")}</span>
        </h1>

        <p
          className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-agro-slate"
          style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
        >
          {L("hiw.hero.subtitle")}
        </p>

        <div
          className="rise mt-9 flex flex-wrap items-center justify-center gap-4"
          style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
        >
          <a
            href="#get-started"
            className="inline-flex h-12 w-44 cursor-pointer items-center justify-center rounded-lg bg-agro-canopy px-6 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 sm:w-auto"
          >
            {L("nav.getEarlyAccess")}
          </a>
          <Link
            href="/features"
            className="inline-flex h-12 w-44 cursor-pointer items-center justify-center rounded-lg border border-agro-sprout bg-white px-6 text-sm font-semibold whitespace-nowrap text-agro-forest shadow-sm transition-all duration-200 hover:border-agro-canopy hover:bg-agro-mint sm:w-auto"
          >
            {L("hiw.hero.browseFeatures")}
          </Link>
        </div>
      </div>

      {/* Route map */}
      <nav
        aria-label={t("hiw.route.navLabel").text}
        className="rise mx-auto mt-16 max-w-4xl px-2"
        style={{ "--rise-delay": "0.32s" } as React.CSSProperties}
      >
        <ol className="flex items-start justify-between gap-1 sm:gap-3">
          {stops.map((stop, i) => (
            <li key={i} className="flex min-w-0 flex-1 items-start">
              <span className="sr-only">
                {t("hiw.route.stepLabel", { n: i + 1, stop: stopTexts[i] }).text}
              </span>
              <div className="flex w-full flex-col items-center gap-2.5">
                <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-agro-canopy bg-agro-mint font-mono text-xs font-bold text-agro-canopy sm:h-10 sm:w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-full truncate text-center font-mono text-[0.6rem] uppercase tracking-wide text-agro-slate sm:text-[0.65rem]">
                  {stop}
                </span>
              </div>
              {i < stops.length - 1 && (
                <span
                  className="mt-[18px] hidden h-px w-full border-t-2 border-dashed border-agro-sprout sm:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
