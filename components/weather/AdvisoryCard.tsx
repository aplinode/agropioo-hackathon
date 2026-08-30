"use client";

import { LeafIcon, AlertTriangleIcon, InfoIcon } from "@/components/icons";
import type { Severity } from "@/lib/weather/advisory";

const severityChip: Record<Severity, string> = {
  info: "bg-agro-mint text-agro-slate",
  warning: "bg-agro-canopy/10 text-agro-canopy",
  critical: "bg-agro-forest text-white",
};

const severityIcon = {
  info: InfoIcon,
  warning: AlertTriangleIcon,
  critical: AlertTriangleIcon,
} as const;

export type AdvisoryCardProps = {
  severity: Severity;
  severityLabel: string;
  growthStageLabel: string;
  adviceText: string;
  dateLabel?: string;
};

/* Today's personalized recommendation for the selected farm (US1). */
export default function AdvisoryCard({
  severity,
  severityLabel,
  growthStageLabel,
  adviceText,
  dateLabel,
}: AdvisoryCardProps) {
  const Icon = severityIcon[severity];
  return (
    <section
      aria-labelledby="advisory-heading"
      className="relative mt-5 overflow-hidden rounded-3xl bg-agro-forest p-6 text-white sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-sprout">
          {dateLabel ?? "Today's advisory"}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold ${severityChip[severity]}`}
        >
          <Icon size={13} />
          {severityLabel}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-agro-sprout">
          <LeafIcon size={18} />
        </span>
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-agro-sprout">
            {growthStageLabel}
          </p>
          <p className="mt-1 text-lg font-semibold leading-snug">{adviceText}</p>
        </div>
      </div>
    </section>
  );
}
