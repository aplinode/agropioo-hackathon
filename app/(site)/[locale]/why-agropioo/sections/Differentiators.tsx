const languages = ["اردو", "پنجابی", "سرائیکی", "پشتو", "بلوچی", "ہندکو"];

function ChipIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
      {children}
    </span>
  );
}

const sparkIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const bookIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const cloudIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
);

const gridIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const pinIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export default function Differentiators() {
  return (
    <section
      id="different"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            What makes it different
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Not another advice app.
            <br />
            A farm intelligence platform.
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            Most tools answer questions. Agropioo learns your farm — and gets
            more useful with every activity you record.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Lead card — personalised */}
          <article className="reveal group flex flex-col rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl md:col-span-2 sm:p-9">
            <ChipIcon>{sparkIcon}</ChipIcon>
            <h3 className="mt-5 font-display text-2xl font-medium tracking-tight text-agro-ink">
              Personalised, not generic
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-agro-slate sm:text-base">
              Recommendations are built from your crop, your location, live
              weather, and your farm&apos;s own history — never one-size-fits-all
              advice.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2.5">
              {["Your crop", "Your district", "This week's weather", "Your last season"].map(
                (chip) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-2 rounded-full border border-agro-sprout bg-white px-4 py-2 font-mono text-xs font-medium tracking-wide text-agro-forest"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-agro-leaf" aria-hidden="true" />
                    {chip}
                  </li>
                ),
              )}
            </ul>
          </article>

          {/* Languages */}
          <article className="reveal group flex flex-col rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-8">
            <ChipIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
            </ChipIcon>
            <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
              Speaks your language
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agro-slate">
              Ask and understand in the way you actually speak — no technical
              English required.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6" dir="rtl" lang="ur">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-agro-sprout bg-white px-3 py-1 text-sm leading-none text-agro-forest"
                >
                  {lang}
                </span>
              ))}
            </div>
          </article>

          {/* Farm memory */}
          <article className="reveal group flex flex-col rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-8">
            <ChipIcon>{bookIcon}</ChipIcon>
            <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
              A memory for every farm
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agro-slate">
              Irrigation, inputs, disease, expenses, harvest — every activity
              kept as a structured record, so each season starts smarter than
              the last.
            </p>
          </article>

          {/* Weather-aware */}
          <article className="reveal group flex flex-col rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-8">
            <ChipIcon>{cloudIcon}</ChipIcon>
            <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
              Weather-aware by default
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agro-slate">
              Guidance reads real conditions before it reaches you — so a
              spray isn&apos;t suggested hours before the rain washes it away.
            </p>
          </article>

          {/* One platform */}
          <article className="reveal group flex flex-col rounded-2xl bg-agro-mint p-7 ring-1 ring-agro-sprout transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-8">
            <ChipIcon>{gridIcon}</ChipIcon>
            <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-2xl">
              One platform, whole season
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-agro-slate">
              Advisor, records, weather guidance, and advisories work together
              instead of living in separate apps and notebooks.
            </p>
          </article>

          {/* Pakistan-first — wide closing banner */}
          <article className="reveal group flex flex-col items-start justify-between gap-6 rounded-2xl bg-agro-canopy p-7 text-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:flex-row sm:items-center md:col-span-2 lg:col-span-3 sm:p-9">
            <div className="flex items-start gap-5 sm:items-center">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
                {pinIcon}
              </span>
              <div>
                <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                  Pakistan-first
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85">
                  Local crops, regional practices, and real field conditions
                  are designed in from day one — not adapted as an
                  afterthought.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-white/30 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-white">
              Built here first
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
