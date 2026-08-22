const audiences = [
  {
    title: "Individual farmers",
    description:
      "Small and mid-size farmers who want practical, personalised help with every decision — plus an organised record of everything already done.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Commercial farms & agri businesses",
    description:
      "Organisations that need structured farm information and dependable decision support across teams, fields, and seasons.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Ecosystem partners",
    description:
      "Input suppliers, cooperatives, insurers, and extension services who will join the platform as it grows into a wider agricultural ecosystem.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

export default function WhoFor() {
  return (
    <section
      id="who"
      className="w-full bg-agro-stone px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal text-agro-canopy">Who it serves</p>
          <h2 className="display-heading reveal mt-5 font-display text-3xl font-medium leading-[1.15] tracking-tight text-agro-ink sm:text-4xl lg:text-[2.9rem]">
            Designed for farmers first
          </h2>
          <p className="reveal mt-5 leading-relaxed text-agro-slate">
            From a single smallholder to the wider agricultural ecosystem —
            Agropioo grows outward from the individual farmer.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {audiences.map((audience, index) => (
            <article
              key={audience.title}
              className="reveal group flex flex-col rounded-2xl border border-agro-clay bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-agro-canopy/50 hover:shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-colors duration-300 group-hover:bg-agro-canopy group-hover:text-white">
                  {audience.icon}
                </span>
                <span
                  className="font-mono text-sm font-semibold tracking-widest text-agro-canopy/40 transition-colors duration-300 group-hover:text-agro-canopy"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-agro-ink sm:text-[1.35rem]">
                {audience.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-agro-slate">
                {audience.description}
              </p>
            </article>
          ))}
        </div>

        <p className="reveal mt-10 flex items-center justify-center gap-4 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
          <span className="hidden h-px w-10 bg-agro-clay sm:inline-block" aria-hidden="true" />
          Growing with the ecosystem around the farm
          <span className="hidden h-px w-10 bg-agro-clay sm:inline-block" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
