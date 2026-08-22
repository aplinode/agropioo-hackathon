const languages = ["اردو", "پنجابی", "سرائیکی", "پشتو", "بلوچی", "ہندکو"];

const recordRows = [
  { date: "12 Aug", activity: "Irrigation", detail: "Canal · 40 min" },
  { date: "09 Aug", activity: "Urea 46% N", detail: "25 kg / acre" },
  { date: "05 Aug", activity: "Leaf scan", detail: "No disease found" },
];

const forecast = [
  { day: "Mon", condition: "sun" },
  { day: "Tue", condition: "sun" },
  { day: "Wed", condition: "cloud" },
  { day: "Thu", condition: "rain", advisory: true },
  { day: "Fri", condition: "sun" },
];

const cardClass =
  "reveal flex flex-col rounded-2xl border border-agro-clay bg-white p-6 shadow-sm transition-all duration-300 hover:border-agro-canopy/40 hover:shadow-lg sm:p-8";

function WeatherGlyph({ kind }: { kind: string }) {
  if (kind === "sun") {
    return (
      <svg className="h-4 w-4 text-agro-wheat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
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
    <svg className="h-4 w-4 text-agro-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
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

export default function CoreFeatures() {
  return (
    <section
      id="features"
      className="w-full bg-agro-stone px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-wheat" aria-hidden="true" />
              Inside the platform
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              Multiple engines,
              <br />
              one intelligence platform
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            From a single question in your own words to a season-long record —
            each capability feeds the next.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* AI advisor — hero card with example conversation */}
          <article className={`${cardClass} md:col-span-2`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardIcon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                <div>
                  <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-earth">
                    Module 01 · Advisor
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
                    AI agriculture advisor
                  </h3>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-agro-slate">
                    Irrigation · fertiliser · pest &amp; disease · harvest
                  </p>
                </div>
              </div>
              <span className="hidden shrink-0 items-center rounded-full border border-agro-sprout bg-agro-mint px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-agro-canopy sm:inline-flex">
                Roman Urdu
              </span>
            </div>

            <div
              className="mt-6 flex-1 space-y-4 rounded-xl bg-agro-mint/60 p-4 sm:p-6"
              role="img"
              aria-label="Example conversation with the Agropioo advisor about yellowing wheat leaves"
            >
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-agro-canopy px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[70%]">
                  Meri gandum ki pattiyan peeli ho rahi hain — kya karoon?
                  <span className="mt-1 block text-right font-mono text-[0.6rem] text-white/60">
                    08:14
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-agro-sprout bg-white px-4 py-3.5 text-sm leading-relaxed text-agro-ink shadow-sm sm:max-w-[78%]">
                  <p className="font-semibold text-agro-canopy">
                    Peeli pattiyan — do common causes:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-agro-wheat" aria-hidden="true" />
                      <span><strong className="font-semibold">Water stress</strong> — irrigate in the cool hours, before 9 AM.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-agro-wheat" aria-hidden="true" />
                      <span><strong className="font-semibold">Nitrogen shortage</strong> — check the oldest leaves first; feed urea if needed.</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-agro-slate">
                    Agar pattiyon ke neeche peeli dhariyan nazar aayein, photo
                    bhejein — main bimari ki tashkhees kar dunga.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-agro-sprout bg-white py-2 pl-4 pr-2 shadow-sm">
                <span className="flex-1 truncate text-sm text-agro-cloud">
                  Apna sawal likhein ya bolein…
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </span>
              </div>
            </div>

            <p className="mt-4 font-mono text-xs leading-relaxed tracking-wide text-agro-slate">
              Ask anything about your crop — everyday questions welcome.
            </p>
          </article>

          {/* Digital farm record */}
          <article className={cardClass}>
            <CardIcon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-earth">
              Module 02 · Records
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
              Digital farm record
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              Every activity logged and structured — so advice learns from your
              own land.
            </p>

            <ul className="mt-6 flex-1 divide-y divide-agro-clay/70 border-y border-agro-clay/70">
              {recordRows.map((row) => (
                <li key={row.date} className="flex items-baseline justify-between gap-2 py-3 sm:gap-3">
                  <span className="shrink-0 font-mono text-xs text-agro-earth">{row.date}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-agro-ink">{row.activity}</span>
                  <span className="max-w-28 text-right font-mono text-xs text-agro-slate sm:max-w-none">{row.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs tracking-wide text-agro-slate">
              Wheat · Rabi season
            </p>
          </article>

          {/* Local language */}
          <article className={cardClass}>
            <CardIcon path="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-earth">
              Module 03 · Language
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-agro-ink">
              Your language, your words
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-agro-slate">
              Speak or type the way you think — no technical English required.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-agro-sprout bg-agro-mint px-3.5 py-1.5 text-base leading-none text-agro-forest"
                  dir="rtl"
                  lang="ur"
                >
                  {lang}
                </span>
              ))}
            </div>
          </article>

          {/* Weather-aware guidance */}
          <article className={`${cardClass} md:col-span-2`}>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <CardIcon path="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-agro-ink">
                  Weather-aware guidance
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                  Advice checks real conditions before it reaches you — spray
                  before rain and you have washed your inputs away.
                </p>
              </div>

              <div
                className="min-w-56 flex-1"
                role="img"
                aria-label="Five-day forecast strip highlighting Thursday as a no-spray advisory day"
              >
                <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {forecast.map((day) => (
                    <li
                      key={day.day}
                      className={`flex flex-col items-center gap-1.5 rounded-lg px-0.5 py-3 sm:rounded-xl sm:px-1 ${
                        day.advisory ? "bg-agro-wheat/15 ring-1 ring-agro-wheat" : "bg-agro-stone"
                      }`}
                    >
                      <span className="font-mono text-[0.65rem] uppercase tracking-wider text-agro-slate">
                        {day.day}
                      </span>
                      <WeatherGlyph kind={day.condition} />
                      <span
                        className={`text-center font-mono text-[0.6rem] uppercase leading-tight tracking-wide ${
                          day.advisory ? "font-bold text-agro-earth" : "text-transparent"
                        }`}
                      >
                        <span className="sm:hidden">{day.advisory ? "!" : "·"}</span>
                        <span className="hidden sm:inline">{day.advisory ? "Hold spray" : "·"}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 flex items-center gap-2 font-mono text-xs text-agro-slate">
                  <span className="inline-block h-2 w-2 rounded-sm bg-agro-wheat/60 ring-1 ring-agro-wheat" aria-hidden="true" />
                  Advisory day flagged from hyperlocal forecast
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
