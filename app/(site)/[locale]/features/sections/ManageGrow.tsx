import { getDictionary } from "@/lib/i18n/server";
import { localized } from "@/lib/i18n/localized";
import type { Locale } from "@/lib/i18n/config";

export default async function ManageGrow({ locale }: { locale: Locale }) {
  const { t } = await getDictionary(locale);
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const recordTimeline = [
    { dateKey: "feat.manage.tl1Date", labelKey: "feat.manage.tl1Label", detailKey: "feat.manage.tl1Detail" },
    { dateKey: "feat.manage.tl2Date", labelKey: "feat.manage.tl2Label", detailKey: "feat.manage.tl2Detail" },
    { dateKey: "feat.manage.tl3Date", labelKey: "feat.manage.tl3Label", detailKey: "feat.manage.tl3Detail" },
  ] as const;

  const schemeChecks = [
    { key: "feat.manage.check1", done: true },
    { key: "feat.manage.check2", done: true },
    { key: "feat.manage.check3", done: true },
    { key: "feat.manage.check4", done: false },
  ] as const;

  return (
    <section
      id="manage-grow"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              {L("feat.manage.eyebrow")}
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              {L("feat.manage.headingA")}
              <br />
              {L("feat.manage.headingB")}
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            {L("feat.manage.sub")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Farm record */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout/80 bg-agro-mint/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.manage.diaryCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.manage.diaryTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.manage.diaryDesc")}
            </p>

            <ol
              className="relative mt-6 flex-1 space-y-5 border-l border-agro-sprout pl-6"
              role="img"
              aria-label={t("feat.manage.timelineMock").text}
            >
              {recordTimeline.map((item) => (
                <li key={item.dateKey} className="relative">
                  <span
                    className="absolute -left-[31px] top-1 inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-agro-canopy bg-white"
                    aria-hidden="true"
                  />
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-wide text-agro-canopy">
                      {L(item.dateKey)}
                    </span>
                    <span className="text-sm font-medium text-agro-ink">{L(item.labelKey)}</span>
                  </p>
                  <p className="font-mono text-xs text-agro-slate">{L(item.detailKey)}</p>
                </li>
              ))}
            </ol>
          </article>

          {/* Scheme matcher */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.manage.schemeCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.manage.schemeTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.manage.schemeDesc")}
            </p>

            <div
              className="mt-6 flex-1 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label={t("feat.manage.checklistMock").text}
            >
              <ul className="space-y-2.5">
                {schemeChecks.map((check) => (
                  <li key={check.key} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-agro-clay">
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        check.done ? "bg-agro-success text-white" : "border border-dashed border-agro-cloud text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <span className={`text-sm ${check.done ? "text-agro-ink" : "text-agro-slate"}`}>
                      {L(check.key)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center justify-between rounded-lg bg-agro-canopy px-3.5 py-2.5 text-white">
                <span className="text-sm font-semibold">{L("feat.manage.programName")}</span>
                <span className="font-mono text-xs font-bold">{L("feat.manage.readyBadge")}</span>
              </p>
            </div>
          </article>

          {/* Carbon credits */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.manage.carbonCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.manage.carbonTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.manage.carbonDesc")}
            </p>

            <div
              className="mt-6 grid flex-1 grid-cols-2 gap-3"
              role="img"
              aria-label={t("feat.manage.carbonMock").text}
            >
              <div className="flex flex-col justify-between rounded-xl bg-agro-mint p-4 ring-1 ring-agro-sprout/70">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-agro-canopy">
                  {L("feat.manage.co2Label")}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-agro-ink">
                  4.8<span className="text-sm text-agro-slate"> t</span>
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-agro-forest p-4 text-white">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-agro-sprout/80">
                  {L("feat.manage.creditLabel")}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-tight">
                  ₨14k
                </p>
              </div>
            </div>
          </article>

          {/* Community */}
          <article className="reveal group flex flex-col rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              {L("feat.manage.forumCode")}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
              {L("feat.manage.forumTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              {L("feat.manage.forumDesc")}
            </p>

            <div
              className="mt-6 flex-1 space-y-3 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label={t("feat.manage.threadMock").text}
            >
              <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-agro-clay">
                <p className="text-sm font-medium text-agro-ink">
                  {L("feat.manage.threadQuestion")}
                </p>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">
                  {L("feat.manage.threadMeta")}
                </p>
              </div>
              <div className="rounded-lg border border-agro-canopy/40 bg-white px-4 py-3">
                <p className="flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-wide text-agro-success">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {L("feat.manage.expertBadge")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-agro-slate">
                  {L("feat.manage.threadAnswer")}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
