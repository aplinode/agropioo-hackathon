import Link from "next/link";
import PageHeader from "@/components/shell/page-header";

export type PestRiskWidgetProps = {
  title: string;
  allClear: string;
  severityWarning: string;
  severityCritical: string;
  highestRisk: string;
  monitoring: string;
  farms: Array<{
    id: string;
    name: string;
    risk: number;
    pest: string | null;
    status: "active" | "monitoring";
  }>;
};

export default function PestRiskWidget({
  title,
  allClear,
  severityWarning,
  severityCritical,
  highestRisk,
  monitoring,
  farms,
}: PestRiskWidgetProps) {
  const warning = farms.filter((f) => f.risk >= 70 && f.risk < 85).length;
  const critical = farms.filter((f) => f.risk >= 85).length;
  const top = farms.slice().sort((a, b) => b.risk - a.risk)[0];

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <PageHeader eyebrow={title} title={allClear} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5">
      <PageHeader eyebrow={title} title={title} />
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="rounded-xl bg-agro-mint p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-agro-canopy">{severityWarning}</p>
          <p className="mt-1 text-2xl font-semibold text-agro-forest">{warning}</p>
        </div>
        <div className="rounded-xl bg-agro-wheat/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-agro-forest">{severityCritical}</p>
          <p className="mt-1 text-2xl font-semibold text-agro-forest">{critical}</p>
        </div>
      </div>
      {top && (
        <div className="mt-4 rounded-xl border border-agro-sprout/60 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-agro-slate">{highestRisk}</p>
          <Link href={`/farms/${top.id}`} className="mt-1 block text-sm font-semibold text-agro-canopy hover:underline">
            {top.name}
          </Link>
          <p className="mt-1 text-sm text-agro-slate">
            {top.pest ? `${top.pest} — ${Math.round(top.risk)}%` : monitoring}
          </p>
        </div>
      )}
    </div>
  );
}
