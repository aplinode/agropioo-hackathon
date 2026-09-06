"use client";
import type { ReactNode } from "react";
import { ArrowRightIcon, WarningIcon, RefreshCwIcon } from "@/components/icons";

type ActionCard = {
  type: "price_table" | "pnl_summary" | "weather_forecast" | "record_diff" | "confirmation";
  data: Record<string, unknown>;
};

type Props = {
  card: ActionCard;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
};

export default function ActionCard({ card, onAction }: Props) {
  const renderContent = (): ReactNode => {
    switch (card.type) {
      case "price_table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-agro-sprout">
                  <th className="pb-1 text-start font-medium text-agro-ink/70">Crop</th>
                  <th className="pb-1 text-start font-medium text-agro-ink/70">Market</th>
                  <th className="pb-1 text-end font-medium text-agro-ink/70">Price</th>
                </tr>
              </thead>
              <tbody>
                {(card.data.rows as Array<{ crop: string; market: string; price: string }> | undefined)?.map((row, i) => (
                  <tr key={i} className="border-b border-agro-sprout/50 last:border-0">
                    <td className="py-1">{row.crop}</td>
                    <td className="py-1">{row.market}</td>
                    <td className="py-1 text-end font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "pnl_summary":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(card.data.rows as Array<{ label: string; value: string; highlight?: boolean }> | undefined)?.map((row, i) => (
              <div key={i} className={`rounded-lg p-2 ${row.highlight ? "bg-agro-leaf/10" : "bg-agro-stone/30"}`}>
                <div className="text-agro-ink/60">{row.label}</div>
                <div className={`mt-0.5 font-medium ${row.highlight ? "text-agro-canopy" : ""}`}>{row.value}</div>
              </div>
            ))}
          </div>
        );

      case "weather_forecast":
        return (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(card.data.rows as Array<{ day: string; condition: string; temp: string }> | undefined)?.map((row, i) => (
              <div key={i} className="rounded-lg bg-agro-stone/30 p-2 text-center">
                <div className="font-medium">{row.day}</div>
                <div className="mt-1 text-agro-ink/70">{row.condition}</div>
                <div className="mt-0.5 font-medium">{row.temp}</div>
              </div>
            ))}
          </div>
        );

      case "record_diff":
        return (
          <div className="space-y-1 text-xs">
            {(card.data.changes as Array<{ field: string; old: string; new: string }> | undefined)?.map((change, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-agro-stone/30 px-2 py-1">
                <span className="font-medium">{change.field}</span>
                <span className="text-agro-ink/50 line-through">{change.old}</span>
                <ArrowRightIcon size={12} />
                <span className="font-medium text-agro-canopy">{change.new}</span>
              </div>
            ))}
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-3">
            <p className="text-sm whitespace-pre-line">{card.data.message as string}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-agro-canopy py-2 text-sm font-medium text-white hover:bg-agro-forest"
                onClick={() => onAction?.("confirm", card.data)}
              >
                Yes
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-agro-sprout py-2 text-sm font-medium text-agro-ink hover:bg-agro-stone/30"
                onClick={() => onAction?.("cancel")}
              >
                No
              </button>
            </div>
          </div>
        );

      default:
        return <div className="text-xs text-agro-ink/60">Unsupported card type</div>;
    }
  };

  const labels: Record<string, string> = {
    price_table: "Price table",
    pnl_summary: "Profit & loss",
    weather_forecast: "Weather",
    record_diff: "Changes",
    confirmation: "Confirm action",
  };

  return (
    <div className="mt-2 rounded-xl border border-agro-sprout bg-agro-stone/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-agro-ink/60">
        {card.type === "confirmation" && <WarningIcon size={14} />}
        {card.type === "record_diff" && <RefreshCwIcon size={14} />}
        <span>{labels[card.type] ?? card.type}</span>
      </div>
      {renderContent()}
    </div>
  );
}
