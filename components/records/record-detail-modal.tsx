"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, EyeIcon } from "@/components/icons";
import { LOCALE_REGISTRY, type Locale } from "@/lib/i18n/config";

type Props = {
  record: Record<string, unknown> | null;
  onClose: () => void;
};

function readAppLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)agro_locale=([^;]+)/);
  const code = match?.[1] as Locale | undefined;
  if (code && LOCALE_REGISTRY[code]) return code;
  return "en";
}

function jsonToText(value: unknown, prefix = ""): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return prefix ? `${prefix}: ${value}` : String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => jsonToText(v)).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => jsonToText(v, k))
      .filter(Boolean)
      .join("\n");
  }
  return String(value);
}

function noteToText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const text = jsonToText(parsed);
      if (text) return text;
    } catch {
      // Not valid JSON — render as-is.
    }
  }
  return raw;
}

function formatDateValue(value: string): string {
  if (!value) return value;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(value) ? `${value.slice(0, 10)}T00:00:00Z` : value;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function RecordDetailModal({ record, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [locale] = useState<Locale>(() => readAppLocale());

  const dir = LOCALE_REGISTRY[locale].dir;
  const lang = LOCALE_REGISTRY[locale].htmlLang;

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

  const rawFields: { label: string; value?: string | number | null; long?: boolean; isDate?: boolean; isNote?: boolean }[] = [
    { label: "Type", value: String(r.type || "") },
    { label: "Date", value: r.event_date ? String(r.event_date) : null, isDate: true },
    { label: "Season", value: String(r.season || "") },
    { label: "Year", value: String(r.year || "") },
    { label: "Title", value: r.title ? String(r.title) : null, long: true },
    { label: "Note", value: r.note ? noteToText(String(r.note)) : null, long: true, isNote: true },
    { label: "Weather", value: r.weather_condition ? String(r.weather_condition) : null },
    { label: "Yield Qty", value: r.yield_qty != null ? String(r.yield_qty) : null },
    { label: "Labor Cost", value: r.labor_cost != null ? String(r.labor_cost) : null },
    { label: "Transport Cost", value: r.transport_cost != null ? String(r.transport_cost) : null },
  ];

  const weatherData = r.weather as Record<string, unknown> | null | undefined;
  if (weatherData) {
    rawFields.push({ label: "Weather Temp", value: weatherData.temp_c != null ? `${weatherData.temp_c}°C` : null });
    rawFields.push({ label: "Weather Condition", value: weatherData.condition ? String(weatherData.condition) : null });
  }

  const fields = rawFields.filter(
    (f) => f.value !== null && f.value !== undefined && f.value !== "",
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir={dir}>
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
        lang={lang}
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
          {fields.map((field) => {
            const display = field.isDate ? formatDateValue(String(field.value)) : String(field.value);
            if (field.long) {
              return (
                <div key={field.label} className="rounded-xl border border-agro-sprout/60 bg-agro-mint/40 px-4 py-2.5">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-agro-slate">
                    {field.label}
                  </span>
                  <p
                    dir="auto"
                    className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-agro-ink"
                  >
                    {display}
                  </p>
                </div>
              );
            }
            return (
              <div key={field.label} className="flex items-baseline justify-between gap-4 rounded-xl border border-agro-sprout/60 bg-agro-mint/40 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-agro-slate">{field.label}</span>
                <span dir="auto" className="text-sm font-medium text-agro-ink text-end">{display}</span>
              </div>
            );
          })}
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
