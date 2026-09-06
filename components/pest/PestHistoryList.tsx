"use client";

import { useEffect, useState } from "react";
import type { PestBundle } from "./pest-bundle";
import PestAlertCard from "./PestAlertCard";

interface PestHistoryListProps {
  bundle: PestBundle;
  farmId?: string;
}

export default function PestHistoryList({ bundle, farmId }: PestHistoryListProps) {
  const [alerts, setAlerts] = useState<
    Array<{
      id: string;
      pest_type: string;
      risk_score: number;
      severity: string;
      recommendation_text: string;
      created_at: string;
      read_at: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const url = new URL("/api/pest/alerts", window.location.origin);
        if (farmId) url.searchParams.set("farm_id", farmId);
        const res = await fetch(url.toString());
        if (res.ok && active) {
          const data = await res.json();
          setAlerts(data ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [farmId]);

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5">
      <h3 className="text-base font-semibold text-agro-forest">{bundle.historyTitle}</h3>
      <p className="mt-1 text-sm text-agro-slate">{bundle.historySubtitle}</p>
      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-agro-slate">{bundle.source.live}</p>}
        {!loading && alerts.length === 0 && (
          <p className="text-sm text-agro-slate">{bundle.historyEmpty}</p>
        )}
        {alerts.map((alert) => (
          <PestAlertCard
            key={alert.id}
            bundle={bundle}
            alert={alert}
            onRead={() =>
              setAlerts((prev) =>
                prev.map((a) => (a.id === alert.id ? { ...a, read_at: new Date().toISOString() } : a)),
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
