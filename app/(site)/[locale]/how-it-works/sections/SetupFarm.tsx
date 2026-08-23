const profileRows = [
  { label: "District", value: "Multan", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
  { label: "Crop", value: "Wheat · Rabi", icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" },
  { label: "Sowing date", value: "20 Nov", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  { label: "Land", value: "12 acres", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" },
];

export default function SetupFarm() {
  return (
    <section
      id="setup"
      className="w-full border-t border-agro-clay/70 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow reveal flex items-center gap-3 text-agro-canopy">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-agro-canopy font-mono text-xs font-bold text-white">
              01
            </span>
            Set up once
          </p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Your farm becomes a living profile
          </h2>
          <p className="reveal mt-5 max-w-md leading-relaxed text-agro-slate">
            Four fields, under a minute — district, crop, sowing date, and
            land size. That is the whole form. From here on, every answer
            knows where it is growing and what it is growing in.
          </p>
          <ul className="reveal mt-7 space-y-3">
            {[
              "Change crop or add fields anytime",
              "Multiple farms for contractors and dealers",
              "Nothing technical asked — no soil reports needed",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-agro-ink sm:text-base">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout" aria-hidden="true">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Onboarding mock */}
        <div
          className="reveal relative mx-auto w-full max-w-md"
          role="img"
          aria-label="Farm profile form with district, crop, sowing date and land size filled in"
        >
          <div className="absolute -left-3 -top-3 h-full w-full rounded-3xl bg-agro-mint" aria-hidden="true" />
          <div className="relative rounded-3xl border border-agro-sprout bg-white p-6 shadow-lg sm:p-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-agro-canopy">
              New farm profile
            </p>

            <dl className="mt-5 space-y-3">
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl border border-agro-clay bg-agro-paper px-4 py-3"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout" aria-hidden="true">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={row.icon} />
                    </svg>
                  </span>
                  <dt className="text-xs uppercase tracking-wide text-agro-slate">{row.label}</dt>
                  <dd className="ml-auto font-mono text-sm font-bold text-agro-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-agro-canopy text-sm font-semibold whitespace-nowrap text-white shadow-sm">
              Create farm profile
            </p>
            <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.16em] text-agro-slate">
              Takes less than a minute
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
