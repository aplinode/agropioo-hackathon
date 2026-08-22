import Image from "next/image";

const readings = [
  {
    label: "Crop health",
    value: "92%",
    note: "Excellent",
    position: "left-[2%] top-[18%] sm:left-[6%] lg:left-[7%]",
  },
  {
    label: "Weather",
    value: "24°C",
    note: "Clear sky",
    position: "bottom-[24%] left-0 lg:left-[1%]",
  },
  {
    label: "Soil moisture",
    value: "65%",
    note: "Optimal",
    position: "bottom-[8%] right-[4%] sm:right-[22%] lg:right-[28%]",
  },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative w-full overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16"
    >
      {/* Furrow contours along the base of the section */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-agro-sprout/60"
        viewBox="0 0 1440 160"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 120C240 90 480 140 720 115C960 90 1200 135 1440 105" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 140C240 112 480 158 720 136C960 114 1200 152 1440 128" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 156C260 132 500 172 740 154C980 136 1220 168 1440 148" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col items-start text-left">
          <p className="eyebrow rise flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-wheat" aria-hidden="true" />
            AI-powered farm intelligence platform
          </p>

          <h1
            className="display-heading rise mt-5 font-display text-[2.6rem] font-medium leading-[1.08] tracking-tight text-agro-ink sm:text-6xl lg:text-[4.25rem]"
            style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
          >
            Intelligence for{" "}
            <span className="relative inline-block text-agro-canopy">
              smarter farming
              <svg
                className="draw absolute -bottom-1 left-0 h-[0.18em] w-full text-agro-wheat sm:-bottom-1.5"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8C60 3 140 10 200 6C240 3.5 275 5 297 4"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p
            className="rise mt-6 max-w-lg text-lg leading-relaxed text-agro-slate"
            style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
          >
            One platform that unites an AI advisor, satellite monitoring,
            market prices, and your farm&apos;s records — turning data into
            clear decisions, in the language you speak.
          </p>

          <div
            className="rise mt-9 flex flex-wrap items-center gap-4"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
          >
            <a
              href="#get-started"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-agro-canopy px-7 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
            >
              Get early access
            </a>
            <a
              href="#journey"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border border-agro-sprout bg-white px-7 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:border-agro-canopy hover:bg-agro-mint"
            >
              See how it works
            </a>
          </div>

          <p
            className="rise mt-9 flex items-center gap-2.5 text-xs text-agro-slate"
            style={{ "--rise-delay": "0.32s" } as React.CSSProperties}
          >
            <span className="font-mono tracking-wide">Built for Pakistan</span>
            <span className="h-1 w-1 rounded-full bg-agro-wheat" aria-hidden="true" />
            <span>A product of Aplinode</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-none">
          <div className="relative h-[420px] w-full sm:h-[520px] lg:h-[560px]">
            <div className="absolute left-1/2 top-1/2 aspect-square h-[118%] -translate-x-1/2 -translate-y-1/2 sm:h-[124%] lg:left-0 lg:h-[134%] lg:-translate-x-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-agro-mint via-agro-mint to-agro-sprout/40" />

              <svg
                className="drift absolute left-[4%] top-[4%] h-[92%] w-[92%] text-agro-leaf/50"
                viewBox="0 0 400 400"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="200" cy="200" r="164" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 10" />
                <circle cx="200" cy="200" r="136" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.7" />
                <circle cx="200" cy="18" r="4" fill="var(--color-agro-wheat)" stroke="none" />
              </svg>

              <div className="absolute inset-0 overflow-hidden rounded-full">
                <Image
                  src="/hero-farmer.png"
                  alt="Farmer using Agropioo on a tablet in the field"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                  priority
                />
              </div>

              {readings.map((reading, index) => (
                <div
                  key={reading.label}
                  className={`rise absolute z-10 w-[7.5rem] rounded-xl border border-agro-clay/70 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm sm:w-36 sm:p-4 ${reading.position}`}
                  style={{ "--rise-delay": `${0.4 + index * 0.12}s` } as React.CSSProperties}
                >
                  <p className="flex items-center gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-agro-canopy">
                    <span className="h-1.5 w-1.5 rounded-full bg-agro-success" aria-hidden="true" />
                    {reading.label}
                  </p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-agro-ink sm:text-[1.75rem]">
                    {reading.value}
                  </p>
                  <p className="text-xs font-medium text-agro-slate">{reading.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
