import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

const SOURCE_LABELS: Record<string, { en: string; color: string }> = {
  amis_pk:        { en: "Punjab AMIS", color: "bg-agro-wheat text-agro-forest" },
  samis_pk:       { en: "Sindh SAMIS", color: "bg-agro-mint text-agro-canopy" },
  fmis_kp:        { en: "KP FMIS", color: "bg-agro-paper text-agro-slate" },
  bmis_balochistan:{ en: "Balochistan BMIS", color: "bg-agro-stone text-agro-ink" },
  pbs_spi:        { en: "PBS SPI", color: "bg-agro-sprout text-agro-forest" },
  seed_pk_initial:{ en: "Seed", color: "bg-agro-leaf/40 text-agro-canopy" },
};

export default function DataSourceBadge({
  sourceCode,
}: {
  sourceCode: string;
  bundle: PricesBundle;
}) {
  const info = SOURCE_LABELS[sourceCode] ?? { en: sourceCode, color: "bg-agro-stone text-agro-slate" };
  return (
    <span
      className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold " + info.color}
      aria-label={"Data source: " + info.en}
      title={info.en}
    >
      {info.en}
    </span>
  );
}
