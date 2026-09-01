import { z } from "zod";

export const ingestRowSchema = z.object({
  source_code: z.enum(["amis_pk", "samis_pk", "fmis_kp", "bmis_balochistan", "pbs_spi", "seed_pk_initial"]),
  mandi_name: z.string().min(1).max(200),
  district: z.string().min(1).max(100),
  province: z.enum(["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad", "Gilgit-Baltistan", "Azad Jammu & Kashmir"]),
  crop: z.string().min(1).max(100),
  unit: z.literal("per_maund_40kg"),
  min_price_pkr: z.number().nonnegative().max(1_000_000),
  modal_price_pkr: z.number().nonnegative().max(1_000_000),
  max_price_pkr: z.number().nonnegative().max(1_000_000),
  observed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_url: z.string().url().optional(),
});

export const ingestBatchSchema = z.object({
  source_run_id: z.string().uuid(),
  rows: z.array(ingestRowSchema).min(1).max(5000),
});

export type IngestRow = z.infer<typeof ingestRowSchema>;
export type IngestBatch = z.infer<typeof ingestBatchSchema>;

const MAX_RETRIES = 1;
const BACKOFF_MS = 1000;

export class IngestError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface PostOptions {
  baseUrl: string;
  secret: string;
  clientIp?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface PostResult {
  status: number;
  body: unknown;
}

export async function postBatch(batch: IngestBatch, options: PostOptions): Promise<PostResult> {
  const url = new URL("/api/prices/ingest", options.baseUrl).toString();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${options.secret}`,
  };
  if (options.clientIp) headers["x-forwarded-for"] = options.clientIp;

  const fetcher = options.fetchImpl ?? fetch;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
        signal: options.signal,
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text.length > 0 ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new IngestError(response.status, parsed, `Ingest ${response.status}`);
        await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
        attempt += 1;
        continue;
      }
      return { status: response.status, body: parsed };
    } catch (err) {
      lastError = err;
      if (attempt >= MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)));
      attempt += 1;
    }
  }

  if (lastError instanceof IngestError) {
    return { status: lastError.status, body: lastError.body };
  }
  throw lastError instanceof Error ? lastError : new Error("postBatch failed");
}

export function chunkBatch(batch: IngestBatch, chunkSize: number): IngestBatch[] {
  if (chunkSize <= 0) throw new Error("chunkSize must be > 0");
  const chunks: IngestBatch[] = [];
  for (let i = 0; i < batch.rows.length; i += chunkSize) {
    chunks.push({ source_run_id: batch.source_run_id, rows: batch.rows.slice(i, i + chunkSize) });
  }
  return chunks;
}
