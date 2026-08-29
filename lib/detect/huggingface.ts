/**
 * Hugging Face Inference API client for plant disease detection
 * (spec FR-8.1–8.2, plan D5/T6). Server-side only — the API key is read
 * from an env var and never exposed to the client.
 *
 * POSTs raw image bytes to the EfficientNetV2s model endpoint and returns
 * the ranked prediction list. Distinct error strings are thrown so the
 * route handler can map them to the right HTTP status (FR-3.4, FR-3.5).
 */

export interface HfPrediction {
  label: string;
  score: number;
}

const HF_ENDPOINT =
  "https://api-inference.huggingface.co/models/animeshakr/plant-disease-efficientnetv2s";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callHuggingFace(
  imageBuffer: Buffer,
  signal?: AbortSignal,
): Promise<HfPrediction[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const res = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
      },
      body: new Uint8Array(imageBuffer),
      signal,
    });

    if (res.status === 200) {
      const data = (await res.json()) as HfPrediction[] | { error?: string; estimated_time?: number };
      if (Array.isArray(data)) return data;
      if (data && typeof data.error === "string") {
        throw new Error("SERVICE_UNAVAILABLE");
      }
      return [];
    }

    if (res.status === 503) {
      lastError = new Error("SERVICE_UNAVAILABLE");
      if (attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("retry-after")) || RETRY_DELAY_MS;
        await delay(retryAfter * (attempt + 1));
        continue;
      }
    }

    if (res.status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`HF error ${res.status}`);
  }

  throw lastError ?? new Error("SERVICE_UNAVAILABLE");
}
