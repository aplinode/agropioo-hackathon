/**
 * Queue drain logic (specs/offline-pwa/spec.md §4, §7).
 *
 * Fires when:
 * 1. The browser emits an `online` event
 * 2. AND the page regains focus / becomes visible
 *
 * Drain is foreground-only (FR-13). It caps total work at 60s
 * (DRAIN_TIMEOUT_MS) and respects exponential backoff per entry
 * (FR-12: BACKOFF_BASE_MS).
 */

import { useEffect } from "react";

import { useOfflineStatus } from "./status";
import {
  getDueWrites,
  getWrite,
  updateWrite,
  deleteWrite,
  deleteWriteAndDependents,
  clearAllWrites,
} from "./queue";

import { DRAIN_TIMEOUT_MS, BACKOFF_BASE_MS, MAX_PENDING_WRITES } from "./types";
import type { QueuedWrite, DrainResult, OfflineStatus } from "./types";

// Re-export constants and types that callers need.
export { DRAIN_TIMEOUT_MS, BACKOFF_BASE_MS, MAX_PENDING_WRITES };
export type { OfflineStatus, QueuedWrite, DrainResult };

/** Re-export the status hook so callers import once from this module. */
export { useOfflineStatus };

/**
 * Compute the next retry timestamp for a given attempt count.
 * FR-12: exponential backoff — 2^attempts * base, capped at 15 minutes.
 */
export function computeRetryAt(attempts: number): number {
  const maxDelay = 15 * 60_000;
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempts), maxDelay);
  return Date.now() + Math.min(delay, maxDelay);
}

/**
 * Replay a single queued write against its endpoint.
 * Returns the HTTP status or throws on network failure.
 */
async function replayWrite(entry: QueuedWrite): Promise<number> {
  const res = await fetch(entry.url, {
    method: entry.method,
    headers: entry.body
      ? { "Content-Type": "application/json" }
      : {},
    body: entry.body ?? undefined,
    credentials: "include",
  });
  return res.status;
}

/**
 * Drain all due writes from the queue.
 *
 * - Skips writes whose `dependsOn` entry is still in the queue (not yet drained).
 * - On 200/201 (success): delete the entry.
 * - On 409 (conflict — server deduped via ON CONFLICT): delete the entry.
 * - On other 4xx (non-retryable client error): delete and mark as skipped.
 * - On 5xx / network error: increment attempts, set retryAt with backoff,
 *   keep in queue. After 5 failed attempts, remove the entry and its dependents.
 *
 * Runs at most DRAIN_TIMEOUT_MS of wall-clock time.
 */
export async function drainQueue(): Promise<DrainResult> {
  const deadline = Date.now() + DRAIN_TIMEOUT_MS;
  const succeeded: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  let pending = await getDueWrites(Date.now());

  while (pending.length > 0 && Date.now() < deadline) {
    let progress = false;

    for (const entry of pending) {
      if (Date.now() >= deadline) break;

      if (entry.dependsOn) {
        const dep = await getWrite(entry.dependsOn);
        if (dep) {
          continue;
        }
      }

      try {
        const status = await replayWrite(entry);

        if (status >= 200 && status < 300) {
          await deleteWrite(entry.uuid);
          succeeded.push(entry.uuid);
          progress = true;
        } else if (status === 409) {
          // Server reported conflict — likely a duplicate client_uuid.
          // The server already has the record; safe to discard.
          await deleteWrite(entry.uuid);
          succeeded.push(entry.uuid);
          progress = true;
        } else if (status >= 400 && status < 500) {
          // Non-retryable client error (except 409 handled above).
          await deleteWrite(entry.uuid);
          skipped.push(entry.uuid);
          progress = true;
        } else {
          throw new Error(`Server returned ${status}`);
        }
      } catch (err) {
        const newAttempts = entry.attempts + 1;
        const retryAt = computeRetryAt(newAttempts);
        const errMsg = err instanceof Error ? err.message : String(err);

        if (newAttempts >= 5) {
          await deleteWriteAndDependents(entry.uuid);
          failed.push(entry.uuid);
        } else {
          await updateWrite(entry.uuid, {
            attempts: newAttempts,
            retryAt,
            lastStatus: null,
            lastError: errMsg,
          });
          failed.push(entry.uuid);
        }
        progress = true;
      }
    }

    if (!progress) {
      break;
    }

    pending = await getDueWrites(Date.now());
  }

  return { succeeded, failed, skipped };
}

/**
 * React hook that attaches connectivity listeners and triggers a drain
 * when the browser goes online AND the page is visible (foreground only).
 * Must be called from a Client Component.
 */
export function useDrainOnReconnect(): OfflineStatus {
  const status = useOfflineStatus();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        drainQueue().catch((err) => console.error("[OFFLINE] Drain failed:", err));
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

/** Clear the entire queue — called on sign-out or after a full sync. */
export async function clearQueue(): Promise<void> {
  await clearAllWrites();
}
