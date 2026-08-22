export default function Vision() {
  return (
    <section className="w-full bg-agro-mint px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-agro-ink sm:text-4xl">
            Built for Pakistan. Ready for the world.
          </h2>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-agro-sprout bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-agro-canopy text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-agro-ink">
              Pakistan-first approach
            </h3>
            <p className="mt-3 leading-relaxed text-agro-slate">
              The first version is designed for Pakistan&apos;s agricultural environment: local crops, regional languages such as Urdu, Punjabi, Saraiki, Pashto, Balochi, and Hindko, local farming practices, and real field conditions.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-agro-slate">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Local crop and climate knowledge
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Multi-language voice and text support
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Refined through real farmer feedback
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-agro-sprout bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-agro-canopy text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.236m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-agro-ink">
              Global expansion vision
            </h3>
            <p className="mt-3 leading-relaxed text-agro-slate">
              Agropioo is built to adapt. As the product matures, it can scale to new countries, languages, crops, climates, and regional farming practices without rebuilding from scratch.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-agro-slate">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Country-specific agricultural knowledge
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Additional languages and local crops
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agro-canopy" />
                Deeper data integrations and analytics
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
