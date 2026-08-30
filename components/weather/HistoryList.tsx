"use client";

import { useState } from "react";
import type { GrowthStage, Severity } from "@/lib/weather/advisory";

export type HistoryItem = {
  id: string;
  advisory_date: string;
  growth_stage: GrowthStage | null;
  advice_text: string;
  severity: Severity;
  acknowledged: boolean;
  acted_upon: boolean;
};

const severityChip: Record<Severity, string> = {
  info: "bg-agro-mint text-agro-slate",
  warning: "bg-agro-canopy/10 text-agro-canopy",
  critical: "bg-agro-forest text-white",
};

export type HistoryListProps = {
  initialItems: HistoryItem[];
  initialCursor: string | null;
  farmId: string;
  strings: {
    date: string;
    severity: string;
    status: string;
    statusNew: string;
    statusSeen: string;
    statusActed: string;
    loadMore: string;
    empty: string;
  };
  severityLabels: Record<Severity, string>;
  stageLabels: Record<GrowthStage, string>;
};

/* Advisory history list with cursor pagination (US4). */
export default function HistoryList({
  initialItems,
  initialCursor,
  farmId,
  strings,
  severityLabels,
  stageLabels,
}: HistoryListProps) {
  const [items, setItems] = useState<HistoryItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/weather/history?farm_id=${encodeURIComponent(farmId)}&limit=20&cursor=${encodeURIComponent(cursor)}`,
      );
      const data = (await res.json()) as { items: HistoryItem[]; next_cursor: string | null };
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.next_cursor);
    } catch {
      // Leave cursor in place so the farmer can retry.
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-agro-sprout bg-agro-mint px-4 py-3 text-sm text-agro-slate">
        {strings.empty}
      </p>
    );
  }

  return (
    <div>
      <ul className="mt-3 divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
        {items.map((item) => {
          const status = item.acted_upon
            ? strings.statusActed
            : item.acknowledged
              ? strings.statusSeen
              : strings.statusNew;
          return (
            <li key={item.id} className="flex items-center gap-3 p-4">
              <div className="w-20 shrink-0">
                <p className="font-semibold text-agro-ink">{item.advisory_date}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-agro-ink">{item.advice_text}</p>
                {item.growth_stage && (
                  <p className="font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                    {stageLabels[item.growth_stage]}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${severityChip[item.severity]}`}
              >
                {severityLabels[item.severity]}
              </span>
              <span className="hidden w-20 shrink-0 text-end font-mono text-[0.7rem] text-agro-slate sm:block">
                {status}
              </span>
            </li>
          );
        })}
      </ul>

      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint disabled:opacity-60"
        >
          {loading ? "…" : strings.loadMore}
        </button>
      )}
    </div>
  );
}
