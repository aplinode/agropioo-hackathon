const quickActions = ["Irrigation", "Fertiliser", "Pesticide", "Disease", "Expense", "Harvest"];

const savedRows = [
  { time: "Today · 6:40 AM", label: "Irrigation logged", detail: "Canal turn · 40 min · plot B" },
  { time: "Yesterday", label: "Fertiliser logged", detail: "DAP 20 kg / acre" },
];

export default function RecordRemember() {
  return (
    <section
      id="record"
      className="w-full bg-agro-mint px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        {/* Recorder mock */}
        <div
          className="reveal relative order-last mx-auto w-full max-w-md lg:order-first"
          role="img"
          aria-label="Activity recorder with quick action chips and recently logged rows"
        >
          <div className="absolute -right-3 -top-3 h-full w-full rounded-3xl bg-agro-sprout/50" aria-hidden="true" />
          <div className="relative rounded-3xl border border-agro-sprout bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
                Log an activity
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-agro-mint px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-wide text-agro-forest ring-1 ring-agro-sprout">
                <span className="h-1.5 w-1.5 rounded-full bg-agro-success" aria-hidden="true" />
                Auto-sync on
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <span
                  key={action}
                  className="rounded-full border border-agro-sprout bg-white px-4 py-2 text-sm font-medium text-agro-forest shadow-sm"
                >
                  {action}
                </span>
              ))}
            </div>

            <ul className="mt-6 space-y-3 border-t border-agro-clay/70 pt-5">
              {savedRows.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-agro-ink">{row.label}</p>
                    <p className="truncate font-mono text-xs text-agro-slate">{row.detail}</p>
                  </div>
                  <span className="ml-auto shrink-0 font-mono text-[0.65rem] uppercase tracking-wide text-agro-slate">
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-xl bg-agro-mint px-4 py-3 font-mono text-xs leading-relaxed text-agro-forest ring-1 ring-agro-sprout/70">
              → Two taps per entry — offline bhi chalta hai
            </p>
          </div>
        </div>

        <div>
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              04
            </span>
            Record as you go
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Two taps now,
            <br />
            smarter answers all season
          </h2>
          <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
            Recording is built for the field — big buttons, few fields, no
            typing required. Each entry becomes part of the farm&apos;s memory,
            so advice keeps sharpening while the crop keeps growing.
          </p>
          <ul className="reveal mt-7 space-y-3">
            {[
              "Irrigation, inputs, disease, expenses, harvest — one timeline",
              "Works fully offline; syncs when signal returns",
              "Season summary ready for banks, buyers, or insurance",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-agro-ink sm:text-base">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-agro-canopy text-white" aria-hidden="true">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
