"use client";

import { useState } from "react";
import { CloseIcon, LeafIcon, PlusIcon } from "@/components/icons";
import type { DetectBundle } from "./detect-bundle";
import type { ScanHistoryItem } from "./detect-types";

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

interface DetectSidebarProps {
  bundle: DetectBundle;
  scans: ScanHistoryItem[];
  onSelectScan: (scan: ScanHistoryItem) => void;
  onDeleteScan: (scanId: string) => void;
  onNewScan: () => void;
  open: boolean;
  onClose: () => void;
}

export default function DetectSidebar({
  bundle,
  scans,
  onSelectScan,
  onDeleteScan,
  onNewScan,
  open,
  onClose,
}: DetectSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleNewScan() {
    setLoading(true);
    onNewScan();
    onClose();
    setLoading(false);
  }

  async function handleDeleteScan(scanId: string) {
    setDeletingId(scanId);
    try {
      await onDeleteScan(scanId);
    } finally {
      setDeletingId(null);
    }
  }

  const hasHistory = scans.length > 0;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-agro-sprout bg-white transition-transform duration-200 lg:relative lg:inset-auto lg:z-auto lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-agro-sprout px-4 py-3">
          <h2 className="text-sm font-semibold text-agro-ink">
            {bundle.sidebar.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-agro-slate hover:bg-agro-mint lg:hidden"
            aria-label={bundle.sidebar.closeSidebar}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-2">
          <button
            type="button"
            onClick={handleNewScan}
            disabled={loading}
            className="flex w-full items-center gap-2 rounded-xl bg-agro-canopy px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-agro-forest disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            {bundle.sidebar.newScan}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {!hasHistory ? (
            <p className="px-2 py-4 text-center text-xs text-agro-cloud">
              {bundle.sidebar.noHistory}
            </p>
          ) : (
            <div>
              <p className="px-2 pb-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-agro-cloud">
                {bundle.sidebar.scansTitle}
              </p>
              <ul className="space-y-0.5">
                {scans.map((scan) => (
                  <li key={scan.id}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectScan(scan)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-start text-sm transition-colors hover:bg-agro-mint/30"
                      >
                        <span className="shrink-0">
                          <LeafIcon size={14} className="text-agro-canopy" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-agro-ink">
                            {scan.diseaseName}
                          </span>
                          <span className="block font-mono text-[0.65rem] text-agro-slate">
                            {scan.crop} · {formatDate(scan.createdAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScan(scan.id)}
                        disabled={deletingId === scan.id}
                        aria-label={bundle.chat.deleteSession}
                        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
