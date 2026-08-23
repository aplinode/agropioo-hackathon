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
  monitor: "border border-agro-sprout bg-white text-agro-ink",
  clear: "bg-agro-mint/60 text-agro-slate",
} as const;

export default function DetectPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Crop doctor"
        title="Spot disease before it spreads"
        description="One photo of a sick leaf is enough — get the likely cause and exactly what to do next."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Scan flow */}
        <div className="lg:col-span-3">
          <DetectUpload />
        </div>

        {/* Diagnosis history */}
        <section aria-labelledby="history-heading" className="lg:col-span-2">
          <h2
            id="history-heading"
            className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
          >
            Past scans
          </h2>
          <ul className="mt-3 space-y-3">
            {demoScanHistory.map((scan) => (
              <li
                key={scan.id}
                className="rounded-2xl border border-agro-sprout bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${outcomeChip[scan.outcome]}`}
                  >
                    {scan.outcome === "clear" && (
                      <CheckIcon size={12} className="me-1" aria-hidden="true" />
                    )}
                    {scanOutcomeLabel[scan.outcome]}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-agro-slate">
                    {scan.when}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-agro-ink">
                  {scan.finding}
                </p>
                <p className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                  {scan.crop}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-agro-slate">
            Every scan stays in your history, so you can show the advisor what
            you saw and when.
          </p>
        </section>
      </div>
    </div>
  );
}
