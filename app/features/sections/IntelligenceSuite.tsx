function CardShell({
  code,
  title,
  description,
  children,
  className = "",
}: {
  code: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`reveal flex flex-col rounded-2xl border border-agro-sprout/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
          {code}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-agro-sprout bg-agro-mint px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-wide text-agro-forest">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Included
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-agro-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-agro-slate">
        {description}
      </p>
      <div className="mt-6 flex-1">{children}</div>
    </article>
  );
}

export default function IntelligenceSuite() {
  return (
    <section
      id="intelligence"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
              <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
              Crop intelligence
            </p>
            <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
              See problems before they cost you
            </h2>
          </div>
          <p className="reveal max-w-md leading-relaxed text-agro-slate lg:col-span-4 lg:col-start-9">
            Disease, pests, weather, and crop choice — the four decisions that
            decide a harvest, each backed by its own engine.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* AI crop doctor */}
          <CardShell
            code="F·01 · Vision"
            title="AI crop doctor"
            description="Photograph an affected leaf and receive the disease name, severity level, and a treatment plan in seconds."
          >
            <div
              className="flex h-full flex-col justify-between gap-4 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70 sm:flex-row sm:items-center"
              role="img"
              aria-label="Leaf scan result showing yellow rust detected with high confidence"
            >
              <div className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-agro-sprout bg-white">
                <svg viewBox="0 0 64 64" fill="none" className="h-16 w-16" aria-hidden="true">
                  <path d="M32 56C18 48 10 38 10 26c0-8 6-14 12-16 4 8 8 12 16 14 1 14-4 26-6 32z" fill="var(--color-agro-sprout)" opacity="0.7" />
                  <path d="M32 56C40 44 50 36 54 22c-6-4-14-4-20 0" stroke="var(--color-agro-canopy)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <circle cx="26" cy="34" r="3" fill="#B91C1C" opacity="0.55" />
                  <circle cx="33" cy="42" r="2.4" fill="#B91C1C" opacity="0.45" />
                </svg>
                <span className="absolute inset-x-2 top-1/2 h-px bg-agro-canopy/70" aria-hidden="true" />
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                <li className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-agro-clay">
                  <span className="text-sm font-semibold text-agro-ink">Yellow rust</span>
                  <span className="font-mono text-xs font-bold text-agro-success">94% match</span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-agro-clay">
                  <span className="text-sm text-agro-slate">Severity</span>
                  <span className="font-mono text-xs font-bold text-agro-warning">Moderate</span>
                </li>
              </ul>
            </div>
          </CardShell>

          {/* Pest outbreak prediction */}
          <CardShell
            code="F·02 · Forecast"
            title="Pest outbreak alerts"
            description="Weather and crop stage feed a risk model that warns days before conditions favour an attack."
          >
            <div
              className="rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label="Seven day pest risk bars rising to high on day six"
            >
              <div className="flex h-28 items-end justify-between gap-1.5">
                {[
                  { d: "M", h: 22 },
                  { d: "T", h: 30 },
                  { d: "W", h: 26 },
                  { d: "T", h: 38 },
                  { d: "F", h: 52 },
                  { d: "S", h: 86, alert: true },
                  { d: "S", h: 44 },
                ].map((bar) => (
                  <div key={`${bar.d}${bar.h}`} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`w-full rounded-t-md ${bar.alert ? "bg-agro-error" : "bg-agro-canopy/70"}`}
                      style={{ height: `${bar.h}%` }}
                    />
                    <span className={`font-mono text-[0.65rem] uppercase ${bar.alert ? "font-bold text-agro-error" : "text-agro-slate"}`}>
                      {bar.d}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-xs text-agro-forest ring-1 ring-agro-clay">
                <span className="h-2 w-2 rounded-full bg-agro-error" aria-hidden="true" />
                Saturday · locust risk 74% — cover young wheat
              </p>
            </div>
          </CardShell>

          {/* Weather-aware advisory */}
          <CardShell
            code="F·03 · Weather"
            title="Weather-aware advisories"
            description="Hyperlocal forecasts meet your crop and growth stage — advice arrives as a clear instruction, not raw data."
          >
            <div
              className="space-y-3 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label="Example weather advisory advising delayed irrigation before rain"
            >
              <div className="flex items-start gap-3 rounded-lg border border-agro-warning/50 bg-white px-4 py-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-warning/15 text-agro-warning" aria-hidden="true">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15zM9 20.25l-.75 1.5m5.25-1.5l-.75 1.5m4.5-1.5l-.75 1.5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-agro-ink">
                    Delay irrigation today
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-agro-slate">
                    Rain expected around 3 PM — let the sky water your field
                    first.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 ring-1 ring-agro-clay">
                <span className="font-mono text-xs text-agro-slate">Water saved</span>
                <span className="font-mono text-sm font-bold text-agro-success">~35%</span>
              </div>
            </div>
          </CardShell>

          {/* Crop recommendation */}
          <CardShell
            code="F·04 · Planning"
            title="Crop recommendation"
            description="Soil, weather, demand, and your budget are scored together — plant what pays this season."
          >
            <ol
              className="space-y-2.5 rounded-xl bg-agro-mint/60 p-4 ring-1 ring-agro-sprout/70"
              role="img"
              aria-label="Ranked crop recommendations with wheat first"
            >
              {[
                { rank: "1", crop: "Wheat", score: 92, pick: true },
                { rank: "2", crop: "Mustard", score: 78, pick: false },
                { rank: "3", crop: "Gram", score: 65, pick: false },
              ].map((row) => (
                <li
                  key={row.crop}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    row.pick ? "bg-white ring-2 ring-agro-canopy" : "bg-white ring-1 ring-agro-clay"
                  }`}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
                    {row.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-agro-ink">
                    {row.crop}
                  </span>
                  <div className="hidden w-24 sm:block" aria-hidden="true">
                    <div className="h-1.5 overflow-hidden rounded-full bg-agro-clay">
                      <div className="h-full rounded-full bg-agro-leaf" style={{ width: `${row.score}%` }} />
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-agro-canopy">{row.score}</span>
                </li>
              ))}
            </ol>
          </CardShell>
        </div>
      </div>
    </section>
  );
}
