import Link from "next/link";

export default function VisionHero() {
  return (
    <section
      id="vision-page"
      className="relative w-full overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24"
    >
      {/* Oversized droplet watermark */}
      <svg
        viewBox="0 0 100 140"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-10 h-[26rem] w-auto text-agro-mint sm:-right-8 lg:right-24 lg:h-[34rem]"
      >
        <path
          d="M50 4C74 40 92 66 92 94a42 42 0 11-84 0C8 66 26 40 50 4z"
          stroke="var(--color-agro-sprout)"
          strokeWidth="1.5"
        />
        <path
          d="M50 22c18 27 32 47 32 68a32 32 0 01-64 0c0-21 14-41 32-68z"
          fill="var(--color-agro-mint)"
        />
      </svg>

      <div className="relative mx-auto max-w-4xl">
        <p className="eyebrow rise flex items-center gap-3 text-agro-canopy">
          <span className="inline-block h-px w-8 bg-agro-leaf" aria-hidden="true" />
          Our vision
        </p>

        <h1
          className="display-heading rise mt-6 font-display text-[2.5rem] font-medium leading-[1.12] tracking-tight text-agro-ink sm:text-6xl lg:text-[4.2rem]"
          style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
        >
          A trusted advisor in{" "}
          <span className="text-agro-canopy">every farmer&apos;s pocket</span>.
        </h1>

        <p
          className="rise mt-7 max-w-2xl text-lg leading-relaxed text-agro-slate sm:text-xl"
          style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
        >
          Intelligent guidance should not depend on wealth, literacy, or
          language. Agropioo exists so that any farmer — on any phone, in any
          village — farms with the same confidence as an expert standing
          beside them.
        </p>

        <div
          className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-agro-clay/70 pt-6 font-mono text-xs uppercase tracking-[0.16em] text-agro-slate"
          style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
        >
          <span>Start where the need is greatest</span>
          <span className="hidden h-1 w-1 rounded-full bg-agro-leaf sm:inline-block" aria-hidden="true" />
          <span>Then earn the world</span>
          <Link
            href="/features"
            className="group ml-auto inline-flex items-center gap-2 font-semibold text-agro-canopy transition-colors hover:text-agro-forest"
          >
            See what we built
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
