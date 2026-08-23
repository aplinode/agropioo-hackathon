import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import { CheckIcon } from "@/components/icons";
import DetectUpload from "./detect-upload";
import { demoScanHistory, scanOutcomeLabel } from "./demo-data";

export const metadata: Metadata = {
  title: "Detect — Agropioo",
};

const outcomeChip = {
  treated: "bg-agro-mint text-agro-canopy",
  monitor: "border border-agro-canopy/30 bg-white text-agro-ink",
  clear: "bg-agro-stone text-agro-slate",
} as const;

export default function DetectPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Crop doctor"
        title="Spot disease before it spreads"
        description="One photo of a sick leaf is enough — get the likely cause and exactly what to do next."
      />

      <div className="mt-6 max-w-2xl">
        <DetectUpload />
      </div>

      {/* Diagnosis history */}
      <section aria-labelledby="history-heading" className="mt-9">
        <h2
          id="history-heading"
          className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
        >
          Past scans
        </h2>
        <ul className="mt-3 divide-y divide-agro-clay overflow-hidden rounded-2xl border border-agro-clay bg-white">
          {demoScanHistory.map((scan) => (
            <li key={scan.id} className="flex items-center gap-3 p-4">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${outcomeChip[scan.outcome]}`}
              >
                {scan.outcome === "clear" && (
                  <CheckIcon size={12} className="me-1" aria-hidden="true" />
                )}
                {scanOutcomeLabel[scan.outcome]}
              </span>
              <p className="min-w-0 flex-1 text-sm leading-snug text-agro-ink">
                <span className="block truncate font-semibold">{scan.finding}</span>
                <span className="block truncate text-xs text-agro-slate">{scan.crop}</span>
              </p>
              <span className="hidden shrink-0 font-mono text-xs text-agro-cloud sm:block">
                {scan.when}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
