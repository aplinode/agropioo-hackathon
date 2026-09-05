/**
 * POST /api/detect — crop disease detection (spec FR-1, FR-3, FR-4, FR-6, FR-8;
 * plan T9). Flow: authenticate → rate-limit → validate image → resize → call
 * Hugging Face → map label → resolve i18n → upload to Cloudinary → persist scan.
 */

import { queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, clientIp } from "@/lib/http";
import { hitLimiter, RATE_RULES } from "@/lib/auth/rate-limit";
import { callHuggingFace } from "@/lib/detect/huggingface";
import { resizeForModel, isImageMime, extensionToMime } from "@/lib/detect/compress";
import { uploadScanImage } from "@/lib/detect/cloudinary";
import { resolveClass } from "@/lib/detect/plantvillage-map";
import { getFastDictionary, requestLocale } from "@/lib/i18n/resolve";
import { generateAdvice } from "@/lib/detect/llm-advice";

const CONFIDENCE_THRESHOLD = 0.5;
const HF_TIMEOUT_MS = 30000;

export async function POST(request: Request) {
  console.error("[DETECT] POST /api/detect called");
  console.error("[DETECT] HF API key exists:", !!process.env.HUGGINGFACE_API_KEY);
  const session = await requireSessionApi();
  if (!session) {
    return errorResponse("unauthorized", "Sign in to use the crop doctor.", 401);
  }

  if (
    !hitLimiter(
      "detect:ip",
      clientIp(request),
      RATE_RULES.detectIp.limit,
      RATE_RULES.detectIp.windowMs,
    )
  ) {
    return errorResponse(
      "rate_limited",
      "Too many scans. Please wait before scanning again.",
      429,
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File) || file.size === 0) {
      return errorResponse("validation_error", "No image provided.", 422);
    }

    const clientUuid = (formData.get("client_uuid") as string | null) ?? null;
    if (
      clientUuid &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientUuid)
    ) {
      return errorResponse("validation_error", "Invalid client_uuid.", 422);
    }

    console.error("[DETECT] Uploaded file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // FR-1.3: only accept real image files.
    const mime = file.type || extensionToMime(file.name);
    if (!isImageMime(mime)) {
      console.error("[DETECT] Invalid MIME type:", mime);
      return errorResponse("validation_error", "Please upload an image file.", 422);
    }

    // Client already compressed to ≤1024px (FR-1.4); server resizes to 384×384 (FR-8.3).
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let modelBuffer: Buffer;
    try {
      modelBuffer = await resizeForModel(inputBuffer);
    } catch {
      return errorResponse(
        "validation_error",
        "Please upload a valid image file.",
        422,
      );
    }

    // HF call with a hard timeout + client-navigation abort (E10, S22).
    const hfController = new AbortController();
    const timeout = setTimeout(() => hfController.abort(), HF_TIMEOUT_MS);
    request.signal?.addEventListener("abort", () => hfController.abort());

    let predictions: { label: string; score: number }[];
    try {
      console.error("[DETECT] Calling Hugging Face API...");
      predictions = await callHuggingFace(modelBuffer, hfController.signal);
      console.error("[DETECT] Hugging Face API success, predictions:", predictions.length);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // E10: navigated away mid-analysis — abort silently, keep nothing.
        return new Response(null, { status: 499 });
      }
      console.error("[DETECT] Hugging Face error:", err);
      if (err instanceof Error && err.message === "Missing HUGGINGFACE_API_KEY") {
        return errorResponse(
          "server_error",
          "Detection service is not configured. Please contact support.",
          503,
        );
      }
      // E7 / E16: AI service unavailable or HF rate-limited.
      const hfMsg = err instanceof Error ? err.message : "Unknown HF error";
      console.error("[DETECT] Hugging Face failed with:", hfMsg);
      return errorResponse(
        "server_error",
        `AI detection service error: ${hfMsg}`,
        503,
      );
    } finally {
      clearTimeout(timeout);
    }

    const topPrediction = predictions[0];
    const confidence = topPrediction?.score ?? 0;
    const confidencePct = Math.round(confidence * 100);

    // FR-3.4 / FR-8.5: below the 0.5 threshold → no diagnosis.
    if (!topPrediction || confidence < CONFIDENCE_THRESHOLD) {
      return jsonResponse({ noDiagnosis: true });
    }

    const advice = resolveClass(topPrediction.label);
    if (!advice) {
      return jsonResponse({ noDiagnosis: true });
    }

    const locale = await requestLocale();
    const dict = await getFastDictionary(locale);
    const crop = dict.t(advice.cropKey).text;

    let diseaseName: string;
    let causes: string;
    let steps: string[];
    let rescanTiming: string;
    let caution: string;

    try {
      const llmAdvice = await generateAdvice({
        diseaseLabel: topPrediction.label,
        crop,
        severity: advice.severity,
        locale,
        confidence: confidencePct,
      });
      diseaseName = topPrediction.label;
      causes = llmAdvice.causes;
      steps = llmAdvice.steps;
      rescanTiming = llmAdvice.rescanTiming;
      caution = llmAdvice.caution;
    } catch {
      diseaseName = dict.t(advice.diseaseNameKey).text;
      causes = dict.t(advice.causesKey).text;
      steps = advice.stepsKeys.map((k) => dict.t(k).text);
      rescanTiming = dict.t(advice.rescanKey).text;
      caution = dict.t(advice.cautionKey).text;
    }

    // FR-6.8: persist the uploaded image to Cloudinary first.
    let imageUrl: string;
    try {
      const upload = await uploadScanImage(
        inputBuffer,
        session.accountId,
        file.name,
      );
      imageUrl = upload.secure_url;
    } catch (err) {
      console.error("[DETECT] Cloudinary upload error:", err);
      const cloudinaryMsg = err instanceof Error ? err.message : "Unknown Cloudinary error";
      return errorResponse(
        "server_error",
        `Image storage error: ${cloudinaryMsg}`,
        503,
      );
    }

    const row = await queryOne<{ id: string; image_url: string }>(
      `INSERT INTO detect_scans
          (account_id, image_url, disease_name, confidence, severity, crop, causes,
           treatment_steps, rescan_timing, caution, client_uuid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (client_uuid) DO NOTHING
        RETURNING id, image_url`,
      [
        session.accountId,
        imageUrl,
        diseaseName,
        confidencePct,
        advice.severity,
        crop,
        causes,
        JSON.stringify(steps),
        rescanTiming,
        caution,
        clientUuid,
      ]
    );

    let scanResult = row;
    if (!scanResult && clientUuid) {
      scanResult = await queryOne<{ id: string; image_url: string }>(
        `SELECT id, image_url FROM detect_scans WHERE client_uuid = $1 LIMIT 1`,
        [clientUuid]
      );
    }

    return jsonResponse(
      {
        scanId: scanResult?.id ?? null,
        diseaseName,
        confidence: confidencePct,
        severity: advice.severity,
        crop,
        causes,
        steps,
        rescanTiming,
        caution,
        imageUrl: scanResult?.image_url ?? imageUrl,
      } as const,
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DETECT] Unexpected error:", err);
    return errorResponse("server_error", message, 500);
  }
}
