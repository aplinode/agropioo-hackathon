/**
 * Offline PWA public API (specs/offline-pwa/spec.md).
 *
 * Components and hooks consumers import from `@/lib/offline`.
 */

export { useOfflineStatus, isLikelyOnline, checkInternet } from "./status";
export { useDrainOnReconnect, drainQueue, computeRetryAt, clearQueue } from "./drain";
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
