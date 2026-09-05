/**
 * Offline PWA public API.
 *
 * Server-safe exports — usable from Server Components.
 * Client-only hooks (useOfflineStatus, useDrainOnReconnect)
 * live in ./hooks and must be imported separately to avoid
 * pulling useEffect into server bundles.
 */

export { isLikelyOnline, checkInternet } from "./status";
export { drainQueue, computeRetryAt, clearQueue } from "./drain";
export {
  generateClientUuid,
  queueWrite,
  queuePhotoUpload,
} from "./queue-helpers";
export {
  enqueueWrite,
  getDueWrites,
  getWrite,
  updateWrite,
  deleteWrite,
  deleteWriteAndDependents,
  clearAllWrites,
  countPendingWrites,
} from "./queue";

export type { OfflineStatus, DrainResult, QueuedWrite, QueuedMethod } from "./types";
export { MAX_PENDING_WRITES, DRAIN_TIMEOUT_MS, BACKOFF_BASE_MS } from "./types";
