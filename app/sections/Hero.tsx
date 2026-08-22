import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-4">
        {/* Left: Copy */}
        <div className="flex flex-col items-start text-left">
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-agro-ink sm:text-5xl lg:text-[3.5rem]">
            AI-Powered Intelligence
            <br />
            <span className="text-agro-canopy">for Smarter Farming</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-agro-slate sm:text-lg">
            Agropioo helps farmers make better decisions with real-time
            insights, smart recommendations and accurate predictions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-agro-canopy px-7 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md"
            >
              Get Started
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-agro-sprout bg-white px-7 text-sm font-semibold text-agro-forest shadow-sm transition-all hover:-translate-y-0.5 hover:border-agro-canopy hover:bg-agro-mint"
            >
              Explore Features
            </a>
          </div>

          <a
            href="#"
            className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-agro-forest transition-colors hover:text-agro-canopy"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-agro-canopy text-agro-canopy">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Watch Demo
          </a>
        </div>

        {/* Right: Visual */}
        <div className="relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-none">
          <div className="relative h-[420px] w-full sm:h-[520px] lg:h-[580px]">
            {/* Circle container extends to the right edge of the viewport */}
            <div className="absolute left-1/2 top-1/2 aspect-square h-[120%] -translate-x-1/2 -translate-y-1/2 sm:h-[125%] lg:left-0 lg:h-[135%] lg:-translate-x-0">
              {/* Soft green background disc */}
              <div className="absolute inset-0 rounded-full bg-agro-mint" />

              {/* Decorative arcs */}
              <svg
                className="absolute left-[5%] top-[5%] h-[90%] w-[90%] text-agro-sprout"
                viewBox="0 0 400 400"
                fill="none"
              >
                <path
                  d="M40 200C40 111.6 111.6 40 200 40"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                />
                <path
                  d="M70 200C70 128.2 128.2 70 200 70"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                />
              </svg>

              {/* Farmer image */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <Image
                  src="/hero-farmer.png"
                  alt="Farmer using Agropioo on a tablet in the field"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>

              {/* Stat cards */}
              <div className="absolute left-[5%] top-[22%] z-10 w-32 rounded-xl bg-white p-3 shadow-lg sm:w-36 sm:p-4 lg:left-[8%] lg:w-40">
                <p className="text-xs font-semibold text-agro-canopy">
                  Crop Health
                </p>
                <p className="mt-1 text-2xl font-bold text-agro-ink sm:text-3xl">
                  92%
                </p>
                <p className="text-xs font-medium text-agro-slate">Excellent</p>
              </div>

              <div className="absolute bottom-[22%] left-[0%] z-10 w-32 rounded-xl bg-white p-3 shadow-lg sm:w-36 sm:p-4 lg:left-[2%] lg:w-40">
                <p className="text-xs font-semibold text-agro-canopy">Weather</p>
                <p className="mt-1 text-2xl font-bold text-agro-ink sm:text-3xl">
                  24°C
                </p>
                <p className="text-xs font-medium text-agro-slate">Clear Sky</p>
              </div>

              <div className="absolute bottom-[12%] right-[18%] z-10 w-32 rounded-xl bg-white p-3 shadow-lg sm:w-36 sm:p-4 lg:right-[30%] lg:w-40">
                <p className="text-xs font-semibold text-agro-canopy">
                  Soil Moisture
                </p>
                <p className="mt-1 text-2xl font-bold text-agro-ink sm:text-3xl">
                  65%
                </p>
                <p className="text-xs font-medium text-agro-slate">Optimal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
