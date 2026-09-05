"use client";

import { useEffect, useState } from "react";

import { useOfflineStatus } from "@/lib/offline/hooks";
import type { ResolvedString } from "@/lib/i18n/logic";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface OfflineBannerProps {
  message: ResolvedString;
}

export function OfflineBanner({ message }: OfflineBannerProps) {
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
      <span>{message.text}</span>
    </div>
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

interface InstallPromptProps {
  installAction: ResolvedString;
  iosPrompt: ResolvedString;
}

export function InstallPrompt({ installAction, iosPrompt }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const showIosPrompt = useState(() => {
    if (typeof window === "undefined") return false;
    return !("BeforeInstallPromptEvent" in window) && isIOS();
  })[0];
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
          {iosPrompt.text}
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
      {installAction.text}
    </button>
  );
}
