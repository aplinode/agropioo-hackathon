"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { compressImageClient } from "@/lib/detect/compress-client";
import { formatMessage } from "@/lib/i18n/logic";
import { FurrowMotif } from "@/components/FurrowMotif";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  XIcon,
} from "@/components/icons";
import FarmSelector from "./farm-selector";
import ScanHistory from "./scan-history";
import DiagnosisCard from "./diagnosis-card";
import type { DetectBundle } from "./detect-bundle";
import type { DiagnosisResult, FarmOption, ScanHistoryItem } from "./detect-types";
import { toDiagnosis } from "./detect-types";

type Stage = "idle" | "analyzing" | "result" | "error";

interface DetectUploadProps {
  bundle: DetectBundle;
  farms: FarmOption[];
  initialScans: ScanHistoryItem[];
  nextCursor: string | null;
}

const SAMPLE_LEAF_URL = "/assets/sample-leaf.jpg";

function composeAdvisorDraft(d: DiagnosisResult, bundle: DetectBundle): string {
  const severityWord =
    d.severity === "treat_now"
      ? bundle.severity.treatNow
      : d.severity === "watch"
        ? bundle.severity.watch
        : bundle.severity.clear;
  return formatMessage(
    "I just scanned my {crop} leaf. The AI detected {disease} with {pct}% confidence. Severity: {sev}. What should I do?",
    {
      crop: d.crop,
      disease: d.diseaseName,
      pct: d.confidence,
      sev: severityWord,
    },
  );
}

export default function DetectUpload({
  bundle,
  farms,
  initialScans,
  nextCursor,
}: DetectUploadProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [viewingScan, setViewingScan] = useState<ScanHistoryItem | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<FarmOption | null>(() => farms[0] ?? null);
  const [noFarmsModalOpen, setNoFarmsModalOpen] = useState(() => farms.length === 0);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "saving">("idle");
  const [savedFarmName, setSavedFarmName] = useState("");
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);
  const [analyzingErrorKind, setAnalyzingErrorKind] = useState<
    "service" | "nod" | "image"
  >("service");
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function revokePreview() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }

  function resetToIdle() {
    revokePreview();
    setPreviewUrl(null);
    setFileName("");
    setResult(null);
    setViewingScan(null);
    setStage("idle");
    setAnalyzingError(null);
  }

  function showError(kind: "service" | "nod" | "image", message: string) {
    setAnalyzingErrorKind(kind);
    setAnalyzingError(message);
    setStage("error");
  }

  async function runAnalysis(blob: Blob, name: string) {
    setFileName(name);
    setResult(null);
    setViewingScan(null);
    setStage("analyzing");
    setAnalyzingError(null);
    setSaveState("idle");

    const formData = new FormData();
    formData.append("image", blob, name);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        credentials: "same-origin",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 499) {
        /* navigated away mid-flight (E10) — silently drop */
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.error?.message ||
          (res.status === 503
            ? bundle.serviceUnavailable
            : "Service temporarily unavailable. Please try again.");
        if (res.status === 415 || res.status === 422) {
          showError("image", bundle.invalidFile);
        } else if (res.status === 503) {
          showError("service", msg);
        } else {
          showError("service", msg);
        }
        return;
      }

      const data = (await res.json()) as {
        noDiagnosis?: boolean;
        scanId?: string | null;
        diseaseName?: string;
        confidence?: number;
        severity?: DiagnosisResult["severity"];
        crop?: string;
        causes?: string;
        steps?: string[];
        rescanTiming?: string;
        caution?: string;
        imageUrl?: string;
      };

      if (data.noDiagnosis) {
        showError("nod", bundle.noDiagnosis);
        return;
      }

      const diagnosis: DiagnosisResult = {
        scanId: data.scanId ?? null,
        diseaseName: data.diseaseName ?? "",
        confidence: data.confidence ?? 0,
        severity: data.severity ?? "watch",
        crop: data.crop ?? "",
        causes: data.causes ?? "",
        steps: data.steps ?? [],
        rescanTiming: data.rescanTiming ?? "",
        caution: data.caution ?? "",
        imageUrl: data.imageUrl ?? previewUrl ?? "",
        saveStatus: "not_saved",
      };
      setResult(diagnosis);
      setStage("result");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // E10
      showError("service", bundle.serviceUnavailable);
    } finally {
      abortRef.current = null;
    }
  }

  async function handleFile(file: File) {
    console.log("[DETECT-UPLOAD] handleFile called:", file.name, file.type, file.size);
    const mime = file.type || (file.name.split(".").pop() ? `image/${file.name.split(".").pop()}` : "");
    if (!mime.startsWith("image/")) {
      showError("image", bundle.invalidFile);
      return;
    }

    try {
      console.log("[DETECT-UPLOAD] Compressing image...");
      const { blob, previewUrl } = await compressImageClient(file);
      console.log("[DETECT-UPLOAD] Compressed, blob size:", blob.size);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = previewUrl;
      setPreviewUrl(previewUrl);
      await runAnalysis(blob, file.name);
    } catch (err) {
      console.error("[DETECT-UPLOAD] Compression error:", err);
      showError("image", bundle.invalidFile);
    }
  }

  async function handleSample() {
    try {
      const res = await fetch(SAMPLE_LEAF_URL);
      if (!res.ok) throw new Error("sample not found");
      const blob = await res.blob();
      const file = new File([blob], "sample-leaf.jpg", { type: "image/jpeg" });
      await handleFile(file);
    } catch {
      showError("service", bundle.serviceUnavailable);
    }
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
  }

  async function handleSaveToFarm() {
    if (!result?.scanId) return;
    if (farms.length === 0) {
      setNoFarmsModalOpen(true);
      return;
    }
    const farm = selectedFarm ?? farms[0] ?? null;
    if (!farm) {
      setNoFarmsModalOpen(true);
      return;
    }

    setSaveState("saving");
    try {
      const res = await fetch("/api/detect/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: result.scanId, farmId: farm.id }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setSaveState("saved");
        setSavedFarmName(farm.name);
        // refresh history from server so the saved status reflects
      } else {
        setSaveState("idle");
      }
    } catch {
      setSaveState("idle");
    }
  }

  const displayedScan: DiagnosisResult | null =
    viewingScan ? toDiagnosis(viewingScan) : result;

  const buildActionBar = (allowSave: boolean) => (
    <div className="flex flex-col gap-3 sm:flex-row">
      {allowSave && farms.length > 0 && selectedFarm && (
        <button
          type="button"
          onClick={handleSaveToFarm}
          disabled={saveState === "saving"}
          className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-agro-wheat text-agro-forest font-semibold shadow-sm transition-colors hover:bg-agro-wheat/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckIcon size={16} aria-hidden="true" />
          {saveState === "saved"
            ? formatMessage(bundle.savedToFarm, { farm: savedFarmName })
            : bundle.saveToFarm}
        </button>
      )}
      <Link
        href={`/advisor?draft=${encodeURI(composeAdvisorDraft(displayedScan as DiagnosisResult, bundle))}`}
        className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
      >
        {bundle.discussAdvisor}
        <ArrowRightIcon size={16} />
      </Link>
      <button
        type="button"
        onClick={resetToIdle}
        className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
      >
        <CheckIcon size={16} aria-hidden="true" />
        {bundle.scanAnother}
      </button>
    </div>
  );

  const diagnosisActions = displayedScan
    ? buildActionBar(displayedScan.saveStatus !== "saved" && saveState !== "saving")
    : null;

  /* ── No-farms modal (FR-2.3, E3/E8) ────────────────── */
  const NoFarmsModal = (
    <div
      className={`fixed inset-0 z-40 flex items-end bg-black/30 transition-opacity ${noFarmsModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={() => setNoFarmsModalOpen(false)}
      aria-hidden={!noFarmsModalOpen}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border-t-4 border-agro-sprout bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={bundle.dismiss}
          onClick={() => setNoFarmsModalOpen(false)}
          className="float-end inline-flex h-8 w-8 items-center justify-center rounded-lg text-agro-slate hover:bg-agro-mint"
        >
          <XIcon size={16} />
        </button>
        <h3 className="font-display text-xl font-bold text-agro-forest">
          {bundle.noFarmsTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-agro-slate">
          {bundle.noFarmsBody}
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/farms/new"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white"
            onClick={() => setNoFarmsModalOpen(false)}
          >
            {bundle.addFarm}
          </Link>
          <button
            type="button"
            onClick={() => setNoFarmsModalOpen(false)}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-lg border border-agro-sprout bg-white px-5 text-sm font-semibold text-agro-forest hover:bg-agro-mint"
          >
            {bundle.dismiss}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {farms.length > 0 && (
        <FarmSelector
          farms={farms}
          bundle={bundle}
          selected={selectedFarm}
          onSelect={setSelectedFarm}
        />
      )}

      {stage === "idle" && (
        <div className="mt-5 flex flex-1 flex-col">
          <label
            htmlFor="detect-photo"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
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
              {bundle.uploadPrompt}
            </span>
            <span className="relative inline-flex min-h-11 items-center gap-2 rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 group-hover:bg-agro-forest group-hover:shadow-md">
              <CameraIcon size={16} />
              {bundle.takePhoto}
            </span>
            <input
              id="detect-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="sr-only"
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs text-agro-slate opacity-0 group-hover:opacity-100">
              {bundle.dragDropPrompt}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSample}
            className="mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-agro-canopy/30 bg-white px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint sm:w-auto sm:self-start sm:px-6"
          >
            {bundle.sampleScan}
          </button>
        </div>
      )}

      {stage === "analyzing" && (
        <div
          className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-agro-sprout bg-white p-8 text-center"
          role="status"
        >
          {previewUrl ? (
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
          <svg
            className="h-5 w-5 animate-spin text-agro-canopy"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path
              fill="currentColor"
              opacity="0.75"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            {bundle.readingLeaf}
          </p>
        </div>
      )}

      {stage === "result" && displayedScan && (
        <DiagnosisCard
          result={displayedScan}
          bundle={bundle}
          actionBar={
            <div className="flex flex-col gap-3 sm:flex-row">
              {viewingScan ? (
                <button
                  type="button"
                  onClick={resetToIdle}
                  className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest hover:border-agro-canopy hover:bg-agro-mint"
                >
                  {bundle.scanAnother}
                </button>
              ) : (
                diagnosisActions
              )}
            </div>
          }
        />
      )}

      {stage === "error" && (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-agro-sprout bg-white p-8 text-center">
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-agro-mint text-agro-canopy ring-1 ring-agro-sprout"
            aria-hidden="true"
          >
            <AlertTriangleIcon size={28} />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-agro-slate">
            {analyzingError}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetToIdle}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white hover:bg-agro-forest"
            >
              {bundle.retry}
            </button>
            {analyzingErrorKind !== "nod" && analyzingErrorKind !== "image" && (
              <button
                type="button"
                onClick={() => {
                  if (previewUrl) handleSample();
                }}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest hover:border-agro-canopy hover:bg-agro-mint"
              >
                {bundle.sampleScan}
              </button>
            )}
          </div>
        </div>
      )}

      {NoFarmsModal}

      {initialScans.length > 0 && (
        <section aria-labelledby="history-heading" className="mt-8">
          <h2
            id="history-heading"
            className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate"
          >
            {bundle.pastScans}
          </h2>
          <ScanHistory
            initialScans={initialScans}
            nextCursor={nextCursor}
            bundle={bundle}
            onScanSelect={setViewingScan}
          />
        </section>
      )}
    </div>
  );
}
