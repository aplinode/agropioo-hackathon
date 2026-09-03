"use client";

import { useEffect, useState } from "react";

import { useOfflineStatus } from "@/lib/offline/status";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Offline banner — shows when connectivity is lost (specs/offline-pwa/spec.md §6).
 */
export function OfflineBanner() {
  const status = useOfflineStatus();

  if (status.online && status.canConnect) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-agro-wheat px-4 py-2.5 text-sm font-medium text-agro-forest shadow-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M21 16.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h15.5c1.1 0 2-.9 2-2Z" />
        <line x1="7" y1="15" x2="17" y2="15" />
        <line x1="7" y1="19" x2="17" y2="19" />
      </svg>
      <span>You&apos;re offline. Your data is saved and will sync when you&apos;re back online.</span>
    </div>
  );
}

/**
 * Install prompt that handles three cases:
 * 1. Android/Chrome/Edge: `beforeinstallprompt` event → show install button
 * 2. iOS Safari: show a banner instructing share-sheet → "Add to Home Screen"
 * 3. Other browsers: hidden
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    if ("BeforeInstallPromptEvent" in window) {
      window.addEventListener("beforeinstallprompt", handler as EventListener);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler as EventListener);
      };
    }

    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua)) {
        setShowIosPrompt(true);
      }
    }
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIosPrompt) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "dismissed") setDismissed(true);
      setDeferredPrompt(null);
    }
  };

  if (showIosPrompt) {
    return (
      <div
        role="status"
        className="fixed inset-x-4 bottom-4 z-40 rounded-lg bg-agro-paper px-4 py-3 shadow-lg ring-1 ring-agro-forest"
      >
        <p className="text-sm text-agro-ink">
          Add Agropioo to your Home Screen for offline access. Tap the Share button, then &quot;Add to Home Screen&quot;.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="fixed inset-x-4 bottom-4 z-40 rounded-lg bg-agro-forest px-4 py-3 text-center text-sm font-semibold text-white shadow-lg transition-colors hover:opacity-90"
    >
      Add to Home Screen
    </button>
  );
}
