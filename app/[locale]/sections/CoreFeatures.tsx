import { localized } from "@/lib/i18n/localized";
import { getCurrentDictionary } from "@/lib/i18n/server";

// All seven constitutional local languages, incl. Sindhi (FR-25).
const languages = [
  { name: "اردو", lang: "ur" },
  { name: "پنجابی", lang: "pa-Arab" },
  { name: "سنڌي", lang: "sd" },
  { name: "سرائیکی", lang: "skr" },
  { name: "پښتو", lang: "ps" },
  { name: "بلوچی", lang: "bal" },
  { name: "ہندکو", lang: "hno" },
];

const recordRows = [
  { date: "12 Aug", activityKey: "home.features.record1Activity", detailKey: "home.features.record1Detail" },
  { date: "09 Aug", activityKey: "home.features.record2Activity", detailKey: "home.features.record2Detail" },
  { date: "05 Aug", activityKey: "home.features.record3Activity", detailKey: "home.features.record3Detail" },
] as const;

const forecast = [
  { dayKey: "home.features.dayMon", condition: "sun" },
  { dayKey: "home.features.dayTue", condition: "sun" },
  { dayKey: "home.features.dayWed", condition: "cloud" },
  { dayKey: "home.features.dayThu", condition: "rain", advisory: true },
  { dayKey: "home.features.dayFri", condition: "sun" },
] as const;

const cardClass =
  "reveal flex flex-col rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8";

function WeatherGlyph({ kind }: { kind: string }) {
  if (kind === "sun") {
    return (
      <svg className="h-4 w-4 text-agro-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    );
  }
  if (kind === "rain") {
    return (
      <svg className="h-4 w-4 text-agro-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15zM9 20.25l-.75 1.5m5.25-1.5l-.75 1.5m4.5-1.5l-.75 1.5" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-agro-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  );
}

function CardIcon({ path }: { path: string }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-canopy text-white">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </span>
  );
}

export default async function CoreFeatures() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  return (
    <section
      id="features"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("home.features.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              {L("home.features.titleA")}
              <br />
              {L("home.features.titleB")}
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            {L("home.features.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* AI advisor — hero card with example conversation */}
          <article className={`${cardClass} md:col-span-2`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardIcon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                <div>
                  <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
                    {L("home.features.advisorModule")}
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
                    {L("home.features.advisorTitle")}
                  </h3>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-agro-slate">
                    {L("home.features.advisorTopics")}
                  </p>
                </div>
              </div>
              <span className="hidden shrink-0 items-center rounded-full border border-agro-sprout bg-agro-mint px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-agro-canopy sm:inline-flex">
                {L("home.features.advisorBadge")}
              </span>
            </div>

            <div
              className="mt-6 flex-1 space-y-4 rounded-xl bg-agro-mint/60 p-4 sm:p-6"
              role="img"
              aria-label={t("home.features.advisorMockAria").text}
            >
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-agro-canopy px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[70%]">
                  {L("home.features.advisorUserMsg")}
                  <span className="mt-1 block text-right font-mono text-[0.6rem] text-white/60">
                    08:14
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-agro-sprout bg-white px-4 py-3.5 text-sm leading-relaxed text-agro-ink shadow-sm sm:max-w-[78%]">
                  <p className="font-semibold text-agro-canopy">
                    {L("home.features.advisorReplyTitle")}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-agro-leaf" aria-hidden="true" />
                      <span><strong className="font-semibold">{L("home.features.advisorReplyCause1")}</strong> {L("home.features.advisorReplyCause1Rest")}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-agro-leaf" aria-hidden="true" />
                      <span><strong className="font-semibold">{L("home.features.advisorReplyCause2")}</strong> {L("home.features.advisorReplyCause2Rest")}</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-agro-slate">
                    {L("home.features.advisorReplyFooter")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-agro-sprout bg-white py-2 ps-4 pe-2 shadow-sm">
                <span className="flex-1 truncate text-sm text-agro-canopy/60">
                  {L("home.features.advisorInputPlaceholder")}
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </span>
              </div>
            </div>

            <p className="mt-4 font-mono text-xs leading-relaxed tracking-wide text-agro-slate">
              {L("home.features.advisorFooter")}
            </p>
          </article>

          {/* Digital farm record */}
          <article className={cardClass}>
            <CardIcon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("home.features.recordsModule")}
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
              {L("home.features.recordsTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("home.features.recordsDesc")}
            </p>

            <ul className="mt-6 flex-1 divide-y divide-agro-clay/70 border-y border-agro-clay/70">
              {recordRows.map((row) => (
                <li key={row.date} className="flex items-baseline justify-between gap-2 py-3 sm:gap-3">
                  <span className="shrink-0 font-mono text-xs text-agro-slate">{row.date}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-agro-ink">{L(row.activityKey)}</span>
                  <span className="max-w-28 text-right font-mono text-xs text-agro-slate sm:max-w-none">{L(row.detailKey)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs tracking-wide text-agro-slate">
              {L("home.features.recordsCropTag")}
            </p>
          </article>

          {/* Local language */}
          <article className={cardClass}>
            <CardIcon path="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("home.features.languageModule")}
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
              {L("home.features.languageTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("home.features.languageDesc")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang.lang}
                  className="rounded-full border border-agro-sprout bg-agro-mint px-3.5 py-1.5 text-base leading-none text-agro-forest"
                  dir="rtl"
                  lang={lang.lang}
                >
                  {lang.name}
                </span>
              ))}
            </div>
          </article>

          {/* Weather-aware guidance */}
          <article className={`${cardClass} md:col-span-2`}>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <CardIcon path="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
                  {L("home.features.weatherModule")}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-agro-ink">
                  {L("home.features.weatherTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                  {L("home.features.weatherDesc")}
                </p>
              </div>

              <div
                className="min-w-56 flex-1"
                role="img"
                aria-label={t("home.features.weatherMockAria").text}
              >
                <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {forecast.map((day) => (
                    <li
                      key={day.dayKey}
                      className={`flex flex-col items-center gap-1.5 rounded-lg px-0.5 py-3 sm:rounded-xl sm:px-1 ${
                        "advisory" in day && day.advisory ? "bg-agro-mint ring-1 ring-agro-canopy" : "bg-white ring-1 ring-agro-clay"
                      }`}
                    >
                      <span className="font-mono text-[0.65rem] uppercase tracking-wider text-agro-slate">
                        {t(day.dayKey).text}
                      </span>
                      <WeatherGlyph kind={day.condition} />
                      <span
                        className={`text-center font-mono text-[0.6rem] uppercase leading-tight tracking-wide ${
                          "advisory" in day && day.advisory ? "font-bold text-agro-forest" : "text-transparent"
                        }`}
                      >
                        {"advisory" in day && day.advisory ? (
                          <>
                            <span className="sm:hidden">!</span>
                            <span className="hidden sm:inline">{t("home.features.holdSpray").text}</span>
                          </>
                        ) : (
                          "·"
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 flex items-center gap-2 font-mono text-xs text-agro-slate">
                  <span className="inline-block h-2 w-2 rounded-sm bg-agro-leaf ring-1 ring-agro-canopy" aria-hidden="true" />
                  {L("home.features.weatherLegend")}
                </p>
              </div>
            </div>
          </article>
        </div>

        <a
          href="#matrix"
          className="reveal group mt-10 inline-flex items-center gap-3 font-mono text-sm font-semibold tracking-wide text-agro-canopy transition-colors hover:text-agro-forest"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-agro-leaf transition-transform duration-300 group-hover:scale-125" aria-hidden="true" />
          {L("home.features.moreLink")}
          <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
