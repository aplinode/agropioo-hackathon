/**
 * Client-only offline hooks (specs/offline-pwa/spec.md §4, §7).
 *
 * Must be imported only from "use client" boundary components.
 * Imports next/offline and react/useEffect which are client-only.
 */
"use client";

import { useEffect } from "react";

import { useOffline } from "next/offline";

import { drainQueue } from "./drain";
import type { OfflineStatus } from "./types";

export { useOffline };

export function useOfflineStatus(): OfflineStatus {
  const isOffline = useOffline();
  return {
    online: !isOffline,
    canConnect: !isOffline,
  };
}

export function useDrainOnReconnect(): OfflineStatus {
  const status = useOfflineStatus();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        drainQueue().catch((err: unknown) =>
          console.error("[OFFLINE] Drain failed:", err),
        );
      }
    };

    window.addEventListener("online", listener);
    window.addEventListener("focus", listener);
    document.addEventListener("visibilitychange", listener);

    return () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("focus", listener);
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);

  return status;
}
