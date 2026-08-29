"use client";

import { useCallback, useState } from "react";
import { CheckIcon, LeafIcon } from "@/components/icons";
import type { ScanHistoryItem, Severity } from "./detect-types";
import type { DetectBundle } from "./detect-bundle";

const severityLabel = {
  watch: "border border-agro-canopy/30 bg-white text-agro-ink",
  treat_now: "bg-agro-wheat text-agro-forest",
  clear: "bg-agro-mint text-agro-canopy",
} as const;

function severityText(severity: Severity, bundle: DetectBundle): string {
  if (severity === "treat_now") return bundle.severity.treatNow;
  if (severity === "watch") return bundle.severity.watch;
  return bundle.severity.clear;
}

function labelFor(scan: ScanHistoryItem, bundle: DetectBundle): string {
  if (scan.farmId) return bundle.savedToFarm.replace("{farm}", scan.farmName ?? scan.farmId ?? "");
  return bundle.unsavedStatus;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

interface ScanHistoryProps {
  initialScans: ScanHistoryItem[];
  nextCursor: string | null;
  bundle: DetectBundle;
  onScanSelect: (scan: ScanHistoryItem) => void;
}

/**
 * Past scans list (FR-6.1–6.7). Renders server-fetched initial rows, then
 * paginates via GET /api/detect/history with a "Load more" button (AC-17/20).
 * Tapping an item opens its full diagnosis card via onScanSelect.
 */
export default function ScanHistory({
  initialScans,
  nextCursor: initialCursor,
  bundle,
  onScanSelect,
}: ScanHistoryProps) {
  const [scans, setScans] = useState<ScanHistoryItem[]>(initialScans);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/detect/history?cursor=${encodeURIComponent(nextCursor)}&limit=20`,
      );
      if (!res.ok) return;
      const data: {
        scans: ScanHistoryItem[];
        nextCursor: string | null;
      } = await res.json();
      setScans((prev) => [...prev, ...data.scans]);
      setNextCursor(data.nextCursor);
    } catch {
      /* keep existing results on network error */
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  if (scans.length === 0) {
    return (
      <p className="mt-3 text-center text-sm text-agro-slate">{bundle.historyEmpty}</p>
    );
  }

  return (
    <>
      <ul className="mt-3 space-y-3">
        {scans.map((scan) => (
          <li
            key={scan.id}
            className="cursor-pointer rounded-2xl border border-agro-sprout bg-white p-4 transition-colors hover:bg-agro-mint"
            onClick={() => onScanSelect(scan)}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${severityLabel[scan.severity]}`}
              >
                {scan.severity === "clear" && (
                  <CheckIcon size={12} className="me-1" aria-hidden="true" />
                )}
                {severityText(scan.severity, bundle)}
              </span>
              <span className="shrink-0 font-mono text-xs text-agro-slate">
                {formatDate(scan.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-agro-ink">
              {scan.diseaseName}
            </p>
            <p className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
              {scan.crop}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-agro-slate">
              <LeafIcon size={12} aria-hidden="true" />
              {labelFor(scan, bundle)}
            </p>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-agro-canopy/30 bg-white px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : bundle.loadMore}
        </button>
      ) : null}
    </>
  );
}
