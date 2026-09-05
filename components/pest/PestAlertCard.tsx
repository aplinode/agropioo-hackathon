"use client";

import type { PestBundle } from "./pest-bundle";

interface PestAlertCardProps {
  bundle: PestBundle;
  alert: {
    id: string;
    pest_type: string;
    risk_score: number;
    severity: string;
    recommendation_text: string;
    created_at: string;
    read_at: string | null;
  };
  onRead?: () => void;
}

export default function PestAlertCard({ bundle, alert, onRead }: PestAlertCardProps) {
  const unread = !alert.read_at;
  const severity =
    alert.severity === "critical"
      ? "text-agro-error"
      : "text-agro-warning";

  async function markRead() {
    try {
      await fetch(`/api/pest/alerts/${alert.id}/read`, { method: "POST" });
      onRead?.();
    } catch {
      // ignore
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${unread ? "border-agro-sprout bg-agro-mint/20" : "border-agro-clay bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${severity}`}>
            {alert.pest_type} — {Math.round(alert.risk_score)}%
          </p>
          <p className="mt-1 text-xs text-agro-slate">
            {new Date(alert.created_at).toLocaleDateString()}
          </p>
        </div>
        {unread && (
          <button
            onClick={markRead}
            className="rounded-lg border border-agro-sprout px-2.5 py-1.5 text-xs font-semibold text-agro-forest transition-colors hover:bg-agro-mint"
          >
            {bundle.alerts.markRead}
          </button>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-agro-ink">{alert.recommendation_text}</p>
    </div>
  );
}
