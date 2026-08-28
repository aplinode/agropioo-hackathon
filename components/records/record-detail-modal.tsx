"use client";

import { useEffect, useRef } from "react";
import { CloseIcon, EyeIcon } from "@/components/icons";

type Props = {
  record: Record<string, unknown> | null;
  onClose: () => void;
};

export default function RecordDetailModal({ record, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!record) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusables?.[0]?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      restoreFocusRef.current?.focus?.();
    };
  }, [record]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;

    const focusables = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!record) return null;

  const r = record as Record<string, unknown>;

  const fields: { label: string; value?: string | number | null }[] = [
    { label: "Type", value: String(r.type || "") },
    { label: "Date", value: String(r.event_date || "") },
    { label: "Season", value: String(r.season || "") },
    { label: "Year", value: String(r.year || "") },
    { label: "Title", value: r.title ? String(r.title) : null },
    { label: "Note", value: r.note ? String(r.note) : null },
    { label: "Weather", value: r.weather_condition ? String(r.weather_condition) : null },
    { label: "Yield Qty", value: r.yield_qty != null ? String(r.yield_qty) : null },
    { label: "Labor Cost", value: r.labor_cost != null ? String(r.labor_cost) : null },
    { label: "Transport Cost", value: r.transport_cost != null ? String(r.transport_cost) : null },
  ];

  const weatherData = r.weather as Record<string, unknown> | null | undefined;
  if (weatherData) {
    fields.push({ label: "Weather Temp", value: weatherData.temp_c != null ? `${weatherData.temp_c}°C` : null });
    fields.push({ label: "Weather Condition", value: weatherData.condition ? String(weatherData.condition) : null });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-agro-ink/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-detail-title"
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg rounded-2xl border border-agro-sprout bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-mint text-agro-canopy">
              <EyeIcon className="h-5 w-5" />
            </span>
            <h2 id="record-detail-title" className="text-base font-semibold text-agro-ink">
              Record Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-agro-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {fields
            .filter((f) => f.value !== null && f.value !== undefined && f.value !== "")
            .map((field) => (
              <div key={field.label} className="flex items-baseline justify-between gap-4 rounded-xl border border-agro-sprout/60 bg-agro-mint/40 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-agro-slate">{field.label}</span>
                <span className="text-sm font-medium text-agro-ink text-right">{String(field.value)}</span>
              </div>
            ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-agro-sprout bg-white px-5 text-sm font-medium text-agro-slate transition-colors hover:bg-agro-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
