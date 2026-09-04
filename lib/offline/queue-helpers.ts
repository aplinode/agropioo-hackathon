/**
 * Client-side helpers for the offline write queue (specs/offline-pwa/spec.md §5).
 *
 * Callers don't need to import the queue internals — they just call
 * `queueWrite(url, method, body, options)` which generates a client_uuid,
 * assigns it to the body if it's a plain object, and stores the entry.
 */

import { enqueueWrite } from "./queue";
import type { QueuedWrite, QueuedMethod } from "./types";

/** Generate a UUID v4 for client-side offline tracking. */
export function generateClientUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2, 18);
}

/**
 * Queue a write for later replay when the browser is back online.
 *
 * @param url - The endpoint path (e.g. "/api/records")
 * @param method - HTTP method
 * @param body - The request payload (will be JSON-stringified)
 * @param dependsOn - Optional UUID of a write this one depends on
 *   (e.g., a photo upload that must succeed before a record referencing it)
 *
 * @returns The client_uuid that was assigned to this write
 */
export async function queueWrite(
  url: string,
  method: QueuedMethod,
  body: unknown,
  dependsOn?: string | null,
): Promise<string> {
  const uuid = generateClientUuid();
  const clientUuid = uuid;

  let storedBody: string | null;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    const enriched = { ...(body as Record<string, unknown>), client_uuid: clientUuid };
    storedBody = JSON.stringify(enriched);
  } else if (body == null) {
    storedBody = null;
  } else if (typeof body === "string") {
    storedBody = body;
  } else {
    storedBody = JSON.stringify(body);
  }

  const entry: QueuedWrite = {
    uuid,
    url,
    method,
    body: storedBody,
    queuedAt: Date.now(),
    clientUuid,
    dependsOn: dependsOn ?? null,
    attempts: 0,
    retryAt: Date.now(),
    lastStatus: null,
    lastError: null,
  };

  await enqueueWrite(entry);
  return clientUuid;
}

/**
 * Queue a photo (Blob) for upload, with an optional dependent record.
 * The dependent record's `imageUrl` will be backfilled by the drain logic
 * after a successful upload — the caller references the photo's client_uuid
 * in `dependsOn`.
 */
export async function queuePhotoUpload(
  url: string,
  blob: Blob,
  dependsOn?: string | null,
): Promise<string> {
  const clientUuid = generateClientUuid();

  const storedBody = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });

  const entry: QueuedWrite = {
    uuid: clientUuid,
    url,
    method: "POST",
    body: storedBody,
    queuedAt: Date.now(),
    clientUuid,
    dependsOn: dependsOn ?? null,
    attempts: 0,
    retryAt: Date.now(),
    lastStatus: null,
    lastError: null,
  };

  await enqueueWrite(entry);
  return clientUuid;
}
