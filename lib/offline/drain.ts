/**
 * Queue drain logic (specs/offline-pwa/spec.md §4, §7).
 *
 * Pure functions — no React imports, safe for Server Components.
 * Client hooks (useDrainOnReconnect) live in ./hooks.
 */

import {
  getDueWrites,
  getWrite,
  updateWrite,
  deleteWrite,
  deleteWriteAndDependents,
  clearAllWrites,
} from "./queue";

import { DRAIN_TIMEOUT_MS, BACKOFF_BASE_MS, MAX_PENDING_WRITES } from "./types";
import type { QueuedWrite, DrainResult } from "./types";

export { DRAIN_TIMEOUT_MS, BACKOFF_BASE_MS, MAX_PENDING_WRITES };
export type { QueuedWrite, DrainResult };

export function computeRetryAt(attempts: number): number {
  const maxDelay = 15 * 60_000;
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempts), maxDelay);
  return Date.now() + Math.min(delay, maxDelay);
}

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
          await deleteWrite(entry.uuid);
          succeeded.push(entry.uuid);
          progress = true;
        } else if (status >= 400 && status < 500) {
          await deleteWrite(entry.uuid);
          skipped.push(entry.uuid);
          progress = true;
        } else {
          throw new Error(`Server returned ${status}`);
        }
      } catch {
        const newAttempts = entry.attempts + 1;
        const retryAt = computeRetryAt(newAttempts);

        if (newAttempts >= 5) {
          await deleteWriteAndDependents(entry.uuid);
          failed.push(entry.uuid);
        } else {
          await updateWrite(entry.uuid, {
            attempts: newAttempts,
            retryAt,
            lastStatus: null,
            lastError: "network",
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

export async function clearQueue(): Promise<void> {
  await clearAllWrites();
}
