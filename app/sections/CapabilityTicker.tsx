const capabilities = [
  "AI crop doctor",
  "Satellite NDVI monitoring",
  "Mandi price intelligence",
  "Weather-aware advisories",
  "Digital farm records",
  "Voice in 6 languages",
  "Pest outbreak alerts",
  "Offline-first + SMS",
];

function TickerContent() {
  return (
    <div className="flex shrink-0 items-center">
      {capabilities.map((item) => (
        <span
          key={item}
          className="flex items-center gap-6 pr-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-agro-sprout sm:gap-8 sm:pr-8 sm:text-sm"
        >
          {item}
          <svg className="h-3 w-3 shrink-0 text-agro-wheat" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C9 7 6 9.5 6 14a6 6 0 0012 0c0-4.5-3-7-6-12z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default function CapabilityTicker() {
  return (
    <div
      className="relative w-full overflow-hidden border-y border-agro-canopy/40 bg-agro-forest py-4"
      aria-label="Agropioo platform capabilities"
    >
      <div className="marquee-track flex w-max">
        <TickerContent />
        <TickerContent />
        <TickerContent />
        <TickerContent />
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-agro-forest to-transparent sm:w-24" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-agro-forest to-transparent sm:w-24" aria-hidden="true" />
    </div>
  );
}
