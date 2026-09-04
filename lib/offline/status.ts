/**
 * Connectivity status via Next.js 16's built-in experimental `useOffline` hook.
 * Re-exported so consuming components import from `@/lib/offline/status`
 * rather than reaching into `next/offline`.
 *
 * The hook is only available in Client Components (it requires React
 * hydration + browser event listeners). Server components must use the
 * static `isLikelyOnline()` helper instead.
 */

import { useOffline } from "next/offline";

import type { OfflineStatus } from "./types";

export { useOffline };

const DNS_CHECK_URL = "https://1.1.1.1/cdn-cgi/.gitconfig";
const DNS_CHECK_TIMEOUT_MS = 4_000;
const DNS_CHECK_CACHE_MS = 30_000;

let lastDnsCheck = 0;
let lastDnsResult = true;

export async function checkInternet(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDnsCheck < DNS_CHECK_CACHE_MS) {
    return lastDnsResult;
  }
  lastDnsCheck = now;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DNS_CHECK_TIMEOUT_MS);
    await fetch(DNS_CHECK_URL, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    lastDnsResult = true;
    return true;
  } catch {
    lastDnsResult = false;
    return false;
  }
}

/**
 * Use in Client Components to get real-time connectivity status.
 * `useOffline()` returns `true` when offline — we invert to `online`.
 * Triggers re-render when the browser fires `online`/`offline` events.
 */
export function useOfflineStatus(): OfflineStatus {
  const isOffline = useOffline();
  return {
    online: !isOffline,
    canConnect: !isOffline,
  };
}

/**
 * Safe for Server Components — always returns `true`.
 * The authoritative client-side check happens in useOfflineStatus().
 */
export function isLikelyOnline(): boolean {
  return true;
}
