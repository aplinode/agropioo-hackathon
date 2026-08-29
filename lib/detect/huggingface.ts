/**
 * Hugging Face Inference API client for plant disease detection
 * (spec FR-8.1–8.2, plan D5/T6). Server-side only — the API key is read
 * from an env var and never exposed to the client.
 *
 * POSTs raw image bytes to the MobileNetV2 plant disease model and returns
 * the ranked prediction list. Distinct error strings are thrown so the
 * route handler can map them to the right HTTP status (FR-3.4, FR-3.5).
 */

export interface HfPrediction {
  label: string;
  score: number;
}

const HF_ENDPOINT = "https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

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

    try {
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
          let retryAfter = RETRY_DELAY_MS;
          try {
            const body = await res.json();
            if (body && typeof body.estimated_time === "number") {
              retryAfter = Math.ceil(body.estimated_time * 1000) + 1000;
            }
            console.error(`[HF] 503 body:`, JSON.stringify(body));
          } catch {
            console.error(`[HF] 503 with no parsable JSON body`);
          }
          console.error(`[HF] Model loading, retrying in ${retryAfter}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await delay(retryAfter);
          continue;
        }
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        console.error(`[HF] Rate limited, retry-after: ${retryAfter}`);
        throw new Error(`RATE_LIMITED${retryAfter ? ` (retry after ${retryAfter}s)` : ""}`);
      }

      const errorText = await res.text().catch(() => "");
      console.error(`[HF] API error ${res.status}: ${errorText}`);
      throw new Error(`HF error ${res.status}: ${errorText || "no response body"}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error("Unknown network error");
      if (attempt < MAX_RETRIES) {
        const wait = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.error(`[HF] Network error (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);
        console.error(`[HF] Retrying in ${wait}ms...`);
        await delay(wait);
        continue;
      }
      throw new Error(`Network error after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("SERVICE_UNAVAILABLE");
}
