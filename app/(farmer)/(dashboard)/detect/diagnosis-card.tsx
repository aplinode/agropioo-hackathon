"use client";

import { DiagnosisResult, Severity } from "./detect-types";
import type { DetectBundle } from "./detect-bundle";

const severityChip = {
  watch: "bg-agro-canopy/10 text-agro-canopy",
  treat_now: "bg-agro-wheat text-agro-forest",
  clear: "bg-agro-mint text-agro-canopy",
} as const;

function severityLabel(severity: Severity, bundle: DetectBundle): string {
  if (severity === "treat_now") return bundle.severity.treatNow;
  if (severity === "watch") return bundle.severity.watch;
  return bundle.severity.clear;
}

/**
 * Presentational result card for a completed scan (spec FR-4, AC-10/11).
 * Renders the eight required diagnosis fields. Action buttons are injected
 * by the parent via `actionBar` so the same card serves both the live
 * analysis flow and the history tap.
 */
export default function DiagnosisCard({
  result,
  bundle,
  actionBar,
}: {
  result: DiagnosisResult;
  bundle: DetectBundle;
  actionBar?: React.ReactNode;
}) {
  const { diseaseName, confidence, severity, crop, causes, steps, rescanTiming, caution, imageUrl } = result;
  const chipClass = severityChip[severity];

  return (
    <section
      aria-labelledby="diagnosis-heading"
      className="mt-5 flex flex-1 flex-col overflow-hidden rounded-3xl border border-agro-sprout bg-white"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Scanned leaf for ${diseaseName}`}
          className="h-44 w-full border-b border-agro-sprout object-cover sm:h-56"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chipClass}`}
          >
            {severity === "clear" && diseaseName === bundle.severity.clear ? null : severityLabel(severity, bundle)}
          </span>
          <span className="inline-flex items-center rounded-full bg-agro-mint px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
            {bundle.confidence.replace("{pct}", String(confidence))}
          </span>
        </div>

        <h2
          id="diagnosis-heading"
          className="display-heading mt-3 font-display text-2xl font-bold leading-snug text-agro-forest"
        >
          {diseaseName}
        </h2>

        {crop ? (
          <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
            {crop}
          </p>
        ) : null}

        {causes ? (
          <p className="mt-2.5 text-sm leading-relaxed text-agro-slate">{causes}</p>
        ) : null}

        <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-slate">
          {bundle.whatToDo}
        </p>
        <ol className="mt-2 space-y-2.5">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-mint font-mono text-[0.7rem] font-bold text-agro-canopy"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-agro-ink">{step}</span>
            </li>
          ))}
        </ol>

        {rescanTiming ? (
          <p className="mt-4 font-mono text-xs text-agro-slate">
            {rescanTiming}
          </p>
        ) : null}

        <div className="mt-auto pt-6">
          {actionBar}
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-agro-slate">
            <svg
              className="h-4 w-4 shrink-0 text-agro-canopy"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0Z" />
              <path d="M12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {caution}
          </p>
        </div>
      </div>
    </section>
  );
}
