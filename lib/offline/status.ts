/**
 * Server-safe connectivity helpers.
 *
 * useOfflineStatus() and useOffline are re-exported from ./hooks
 * (client-only boundary). This module is safe to import from Server
 * Components.
 */

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
 * Safe for Server Components — always returns `true`.
 * The authoritative client-side check happens in useOfflineStatus().
 */
export function isLikelyOnline(): boolean {
  return true;
}
