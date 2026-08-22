import Link from "next/link";

const furrowCurves = [
  { d: "M-20 268C110 208 250 330 560 244", width: 2, opacity: 0.9 },
  { d: "M-20 308C120 252 270 368 560 286", width: 1.75, opacity: 0.65 },
  { d: "M-20 348C130 296 290 406 560 328", width: 1.5, opacity: 0.45 },
  { d: "M-20 388C140 340 310 444 560 370", width: 1.25, opacity: 0.3 },
  { d: "M-20 428C150 384 330 482 560 412", width: 1, opacity: 0.18 },
];

export default function WhyHero() {
  return (
    <section
      id="why"
      className="relative w-full overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-start text-left">
          <p className="eyebrow rise flex items-center gap-3 text-agro-canopy">
            <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
            Why Agropioo
          </p>

          <h1
            className="display-heading rise mt-5 font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight text-agro-ink sm:text-6xl lg:text-[4rem]"
            style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
          >
            Where soil meets{" "}
            <span className="text-agro-canopy">signal</span>
          </h1>

          <p
            className="rise mt-6 max-w-lg text-lg leading-relaxed text-agro-slate"
            style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
          >
            Farming decisions are too important for guesswork. Agropioo puts an
            AI advisor, your farm&apos;s records, weather-aware guidance, and
            your own language into one platform — so every choice is grounded
            in your land&apos;s reality.
          </p>

          <div
            className="rise mt-9 flex flex-wrap items-center gap-4"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
          >
            <a
              href="#get-started"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-agro-canopy px-7 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
            >
              Get early access
            </a>
            <Link
              href="/#features"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border border-agro-sprout bg-white px-7 text-sm font-semibold whitespace-nowrap text-agro-forest shadow-sm transition-all duration-200 hover:border-agro-canopy hover:bg-agro-mint"
            >
              Explore the platform
            </Link>
          </div>

          <p
            className="rise mt-9 flex items-center gap-2.5 text-xs text-agro-slate"
            style={{ "--rise-delay": "0.32s" } as React.CSSProperties}
          >
            <span className="font-mono tracking-wide">Built for Pakistan</span>
            <span className="h-1 w-1 rounded-full bg-agro-leaf" aria-hidden="true" />
            <span>A product of Aplinode</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
          <div
            className="rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-agro-mint via-agro-mint to-agro-sprout/50 ring-1 ring-agro-sprout"
            style={{ "--rise-delay": "0.2s" } as React.CSSProperties}
          >
            <svg
              viewBox="0 0 520 420"
              fill="none"
              className="h-auto w-full"
              role="img"
              aria-label="Stylised furrow curves rolling across a field"
            >
              {furrowCurves.map((curve) => (
                <path
                  key={curve.d}
                  d={curve.d}
                  stroke="var(--color-agro-canopy)"
                  strokeWidth={curve.width}
                  strokeLinecap="round"
                  opacity={curve.opacity}
                />
              ))}

              {/* Seedling droplet accent */}
              <g transform="translate(356 96)">
                <path
                  d="M0 -46C22 -14 34 4 34 24a34 34 0 11-68 0c0-20 12-38 34-70z"
                  fill="var(--color-agro-canopy)"
                />
                <path
                  d="M-2 52V16m0 0c-10-2-18-9-20-19 10 2 18 9 20 19zm0 12c10-2 17-8 19-17-10 2-17 8-19 17z"
                  stroke="var(--color-agro-paper)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>

              {/* Circuit traces */}
              <g stroke="var(--color-agro-leaf)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
                <path d="M84 84h56l22 22v30" fill="none" />
                <path d="M62 132h44l20 20" fill="none" />
                <circle cx="162" cy="136" r="4" fill="var(--color-agro-leaf)" stroke="none" />
                <circle cx="126" cy="152" r="4" fill="var(--color-agro-leaf)" stroke="none" />
                <circle cx="84" cy="84" r="4" fill="var(--color-agro-leaf)" stroke="none" />
                <circle cx="62" cy="132" r="4" fill="var(--color-agro-leaf)" stroke="none" />
              </g>

              {/* Mono signal labels riding the contours */}
              <g fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2">
                <text x="118" y="238" fill="var(--color-agro-canopy)" opacity="0.75">
                  SOIL
                </text>
                <text x="332" y="272" fill="var(--color-agro-canopy)" opacity="0.55">
                  SIGNAL
                </text>
                <text x="222" y="372" fill="var(--color-agro-canopy)" opacity="0.4">
                  SEASON DATA
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
