/**
 * IndexedDB-backed write queue (specs/offline-pwa/spec.md §5).
 *
 * Stores queued writes in the `writes` object store with:
 * - keyPath: uuid
 * - indexes on: queuedAt, retryAt, dependsOn, attempts
 *
 * Pending cap: 200 entries (MAX_PENDING_WRITES). When the cap is hit,
 * the oldest entry (by queuedAt) is evicted to make room for new writes.
 *
 * Uses the native IndexedDB API directly — no external dependency required.
 */

import { MAX_PENDING_WRITES } from "./types";
import type { QueuedWrite, WriteRecord } from "./types";

const DB_NAME = "agropioo-offline";
const DB_VERSION = 1;
const STORE_NAME = "writes";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
        store.createIndex("queuedAt", "queuedAt", { unique: false });
        store.createIndex("retryAt", "retryAt", { unique: false });
        store.createIndex("dependsOn", "dependsOn", { unique: false });
        store.createIndex("attempts", "attempts", { unique: false });
      }
    };
  });

  return dbPromise;
}

function toRecord(entry: QueuedWrite): WriteRecord {
  return {
    uuid: entry.uuid,
    url: entry.url,
    method: entry.method,
    body: entry.body,
    queuedAt: entry.queuedAt,
    clientUuid: entry.clientUuid,
    dependsOn: entry.dependsOn ?? null,
    attempts: entry.attempts,
    retryAt: entry.retryAt,
    lastStatus: entry.lastStatus ?? null,
    lastError: entry.lastError ?? null,
  };
}

function fromRecord(record: WriteRecord): QueuedWrite {
  return {
    uuid: record.uuid,
    url: record.url,
    method: record.method,
    body: record.body,
    queuedAt: record.queuedAt,
    clientUuid: record.clientUuid,
    dependsOn: record.dependsOn ?? null,
    attempts: record.attempts,
    retryAt: record.retryAt,
    lastStatus: record.lastStatus ?? null,
    lastError: record.lastError ?? null,
  };
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueue a new write. If the pending count exceeds MAX_PENDING_WRITES,
 * the oldest entry (by queuedAt) is evicted to make room for new writes.
 */
export async function enqueueWrite(entry: QueuedWrite): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const count = await promisifyRequest(store.count());
  if (count >= MAX_PENDING_WRITES) {
    const index = store.index("queuedAt");
    const cursorRequest = index.openCursor(null, "prev");
    await new Promise<void>((resolve) => {
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  await promisifyRequest(store.put(toRecord(entry)));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve all entries ready for retry (retryAt ≤ now, ordered by retryAt asc). */
export async function getDueWrites(now: number = Date.now()): Promise<QueuedWrite[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("retryAt");
  const range = IDBKeyRange.upperBound(now);

  const records = await promisifyRequest(index.getAll(range));
  records.sort((a, b) => a.retryAt - b.retryAt);
  return records.map(fromRecord);
}

/** Get all writes (for inspection / manual drain triggers). */
export async function getAllWrites(): Promise<QueuedWrite[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const records = await promisifyRequest(store.getAll());
  records.sort((a, b) => a.retryAt - b.retryAt);
  return records.map(fromRecord);
}

/** Get a single write by UUID. */
export async function getWrite(uuid: string): Promise<QueuedWrite | null> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const record = await promisifyRequest(store.get(uuid));
  return record ? fromRecord(record) : null;
}

/** Update a write record in place (after a failed attempt). */
export async function updateWrite(
  uuid: string,
  partial: Partial<WriteRecord>,
): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const existing = await promisifyRequest(store.get(uuid));
  if (!existing) {
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.abort();
    });
    return;
  }

  await promisifyRequest(store.put({ ...existing, ...partial }));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete a single write (called after successful replay). */
export async function deleteWrite(uuid: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await promisifyRequest(store.delete(uuid));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Remove a write and all of its transitive dependents (writes whose
 * `depends_on` chain includes it). Used when a dependency fails
 * permanently.
 */
export async function deleteWriteAndDependents(uuid: string): Promise<string[]> {
  const db = await openDatabase();
  const deleted: string[] = [];
  const toProcess: string[] = [uuid];

  while (toProcess.length > 0) {
    const current = toProcess.pop()!;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("dependsOn");

    const dependents = await promisifyRequest(index.getAll(current));
    for (const dep of dependents) {
      toProcess.push(dep.uuid);
    }

    await promisifyRequest(store.delete(current));
    deleted.push(current);
  }

  return deleted;
}

/** Clear all writes (used after a successful full drain or on sign-out). */
export async function clearAllWrites(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Count of pending writes in the queue. */
export async function countPendingWrites(): Promise<number> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  return promisifyRequest(store.count());
}

export { MAX_PENDING_WRITES };
