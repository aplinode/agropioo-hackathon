import Image from "next/image";
import { FurrowMotif } from "./FurrowMotif";
import { ArrowRightIcon } from "./icons";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-40">
        <div className="max-w-xl">
          <p
            className="rise inline-flex items-center gap-2 rounded-full border border-agro-sprout bg-agro-mint px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-agro-canopy"
            style={{ "--rise-delay": "0s" } as React.CSSProperties}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-agro-leaf" />
            AI Agriculture Advisor
          </p>

          <h1
            className="rise display-heading mt-6 font-display text-[clamp(2.75rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-agro-forest"
            style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
          >
            Ask anything about your crop.
          </h1>

          <p
            className="rise mt-6 max-w-lg text-lg leading-relaxed text-agro-slate"
            style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
          >
            Agropioo pairs personalised AI guidance with a lasting record of
            your farm — tuned to your weather, your soil, and the language you
            think in.
          </p>

          <div
            className="rise mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
          >
            <a
              href="#early-access"
              className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-agro-wheat px-6 text-sm font-semibold text-agro-forest shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
            >
              Get early access
              <ArrowRightIcon size={18} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-agro-canopy/30 bg-white px-6 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint"
            >
              See how it works
            </a>
          </div>

          <p
            className="rise mt-7 text-sm text-agro-slate"
            style={{ "--rise-delay": "0.32s" } as React.CSSProperties}
          >
            Launching first in Pakistan · Six local languages
          </p>
        </div>

        <div
          className="rise relative mx-auto w-full max-w-[540px]"
          style={{ "--rise-delay": "0.2s" } as React.CSSProperties}
        >
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-agro-sprout/70 bg-gradient-to-b from-white via-agro-mint to-agro-mint">
            <Image
              src="/logo.png"
              alt="Agropioo logo — a green droplet holding a seedling, circuit traces, and furrows"
              width={120}
              height={120}
              className="absolute left-1/2 top-[13%] h-auto w-24 -translate-x-1/2 object-contain sm:w-28"
            />
            <FurrowMotif className="absolute bottom-0 left-0 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
