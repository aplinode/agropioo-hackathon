"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FurrowMotif } from "@/components/FurrowMotif";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
} from "@/components/icons";
import { sampleDiagnosis } from "./demo-data";

type DetectStage = "idle" | "analyzing" | "result";

const captureTips = [
  "Fill the frame with one leaf",
  "Shoot in daylight",
  "Keep your shadow off it",
] as const;

/* Crop detection (UI-only demo): pick a photo or run the sample scan,
   watch it analyze, and read a clearly-labelled sample diagnosis. */
export default function DetectUpload() {
  const [stage, setStage] = useState<DetectStage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const objectUrlRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  /* Clean up the object URL and any pending timer on unmount. */
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function beginAnalysis(label: string, url?: string) {
    setFileName(label);
    if (url) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    }
    setStage("analyzing");
    // Demo analysis. Swap for POST /api/detect once wired.
    timerRef.current = window.setTimeout(() => {
      setStage("result");
    }, 1400);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    beginAnalysis(file.name, URL.createObjectURL(file));
  }

  function reset() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPreviewUrl(null);
    setFileName("");
    setStage("idle");
  }

  return (
    <div className="flex h-full flex-col">
      <p className="rounded-xl border border-agro-sprout bg-agro-mint px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        DEMO · every photo returns a labelled sample diagnosis
      </p>

      {stage === "idle" && (
        <div className="mt-5 flex flex-1 flex-col">
          <label
            htmlFor="detect-photo"
            className="group relative flex min-h-64 flex-1 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed border-agro-leaf/50 bg-white p-6 text-center transition-colors hover:border-agro-canopy hover:bg-agro-mint"
          >
            <FurrowMotif
              tone="ghost"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-agro-sprout/40"
            />
            <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-agro-canopy group-hover:text-white">
              <CameraIcon size={28} />
            </span>
            <span className="relative max-w-xs font-display text-xl font-bold leading-snug text-agro-forest">
              Photograph the sick leaf
            </span>
            <span className="relative inline-flex min-h-11 items-center gap-2 rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 group-hover:bg-agro-forest group-hover:shadow-md">
              <CameraIcon size={16} />
              Take or choose a photo
            </span>
            <input
              id="detect-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="sr-only"
            />
          </label>

          {/* Capture tips */}
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {captureTips.map((tip, index) => (
              <li
                key={tip}
                className="rounded-xl border border-agro-sprout bg-white p-2.5 text-center"
              >
                <span
                  className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-agro-mint font-mono text-[0.7rem] font-bold text-agro-canopy"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="block text-[0.7rem] leading-snug text-agro-slate">
                  {tip}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => beginAnalysis("sample-wheat-leaf.jpg")}
            className="mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-agro-canopy/30 bg-white px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint sm:w-auto sm:self-start sm:px-6"
          >
            No photo handy? Run a sample scan
          </button>
        </div>
      )}

      {stage === "analyzing" && (
        <div
          className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-agro-sprout bg-white p-8 text-center"
          role="status"
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={`Photo being analyzed: ${fileName}`}
              className="h-44 w-full max-w-sm rounded-2xl border border-agro-sprout object-cover"
            />
          ) : (
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout"
              aria-hidden="true"
            >
              <CameraIcon size={28} />
            </span>
          )}
          <svg className="h-5 w-5 animate-spin text-agro-canopy" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            Reading the leaf…
          </p>
        </div>
      )}

      {stage === "result" && (
        <section
          aria-labelledby="diagnosis-heading"
          className="mt-5 flex flex-1 flex-col overflow-hidden rounded-3xl border border-agro-sprout bg-white"
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={`Scanned photo: ${fileName}`}
              className="h-44 w-full border-b border-agro-sprout object-cover sm:h-56"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center gap-3 border-b border-agro-sprout bg-agro-mint">
              <CameraIcon size={20} className="text-agro-canopy" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-wide text-agro-canopy">
                Sample scan · wheat leaf
              </p>
            </div>
          )}
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-agro-canopy/10 px-3 py-1 text-xs font-semibold text-agro-canopy">
                <AlertTriangleIcon size={13} aria-hidden="true" />
                Watch
              </span>
              <span className="inline-flex items-center rounded-full bg-agro-mint px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">
                Confidence {sampleDiagnosis.confidencePct}% · sample
              </span>
            </div>
            <h2
              id="diagnosis-heading"
              className="display-heading mt-3 font-display text-2xl font-bold leading-snug text-agro-forest"
            >
              {sampleDiagnosis.condition}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-agro-slate">
              Rust-coloured pustules on {sampleDiagnosis.crop.toLowerCase()}
              leaves — caught early, this is very manageable.
            </p>

            <p className="mt-5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-slate">
              What to do now
            </p>
            <ol className="mt-2 space-y-2.5">
              {sampleDiagnosis.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
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

            <div className="mt-auto pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/advisor"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest active:translate-y-0"
                >
                  Discuss with advisor
                  <ArrowRightIcon size={16} />
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
                >
                  <CheckIcon size={16} aria-hidden="true" />
                  Scan another leaf
                </button>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-agro-slate">
                <AlertTriangleIcon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Sample result for the demo build — always confirm treatment with
                your local agriculture office before spraying.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
