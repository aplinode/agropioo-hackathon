import { localized } from "@/lib/i18n/localized";
import { getCurrentDictionary } from "@/lib/i18n/server";

function TickerContent({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <span
          key={index}
          className="flex items-center gap-6 pr-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-agro-sprout sm:gap-8 sm:pr-8 sm:text-sm"
        >
          {item}
          <svg className="h-3 w-3 shrink-0 text-agro-leaf" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C9 7 6 9.5 6 14a6 6 0 0012 0c0-4.5-3-7-6-12z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default async function CapabilityTicker() {
  const { locale, t } = await getCurrentDictionary();
  const L = (key: Parameters<typeof t>[0]) => localized(t(key), locale);

  const capabilities = [
    L("home.ticker.cropDoctor"),
    L("home.ticker.satelliteNdvi"),
    L("home.ticker.mandiPrices"),
    L("home.ticker.weatherAdvisories"),
    L("home.ticker.farmRecords"),
    L("home.ticker.advisoryLanguages"),
    L("home.ticker.pestAlerts"),
    L("home.ticker.offlineSms"),
  ];

  return (
    <div
      className="relative w-full overflow-hidden border-y border-agro-canopy/40 bg-agro-forest py-4"
      aria-label={t("home.ticker.ariaLabel").text}
    >
      <div className="marquee-track flex w-max">
        <TickerContent items={capabilities} />
        <TickerContent items={capabilities} />
        <TickerContent items={capabilities} />
        <TickerContent items={capabilities} />
      </div>

      {/* Edge fades — logical start/end sides mirror under RTL */}
      <div className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-agro-forest to-transparent rtl:bg-gradient-to-l sm:w-24" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-agro-forest to-transparent rtl:bg-gradient-to-r sm:w-24" aria-hidden="true" />
    </div>
  );
}
