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

const CONFIDENCE_THRESHOLD = 0.5;
const HF_TIMEOUT_MS = 30000;

export async function POST(request: Request) {
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

    // FR-1.3: only accept real image files.
    const mime = file.type || extensionToMime(file.name);
    if (!isImageMime(mime)) {
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
      predictions = await callHuggingFace(modelBuffer, hfController.signal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // E10: navigated away mid-analysis — abort silently, keep nothing.
        return new Response(null, { status: 499 });
      }
      // E7 / E16: AI service unavailable or HF rate-limited.
      return errorResponse(
        "server_error",
        "Service temporarily unavailable. Please try again.",
        503,
      );
    } finally {
      clearTimeout(timeout);
    }

    const top = predictions[0];
    const confidence = top?.score ?? 0;

    // FR-3.4 / FR-8.5: below the 0.5 threshold → no diagnosis.
    if (!top || confidence < CONFIDENCE_THRESHOLD) {
      return jsonResponse({ noDiagnosis: true });
    }

    const advice = resolveClass(top.label);
    if (!advice) {
      return jsonResponse({ noDiagnosis: true });
    }

    // Resolve advice text in the farmer's selected language (FR-4.9).
    const locale = await requestLocale();
    const dict = await getFastDictionary(locale);
    const diseaseName = dict.t(advice.diseaseNameKey).text;
    const crop = dict.t(advice.cropKey).text;
    const causes = dict.t(advice.causesKey).text;
    const steps = advice.stepsKeys.map((k) => dict.t(k).text);
    const rescanTiming = dict.t(advice.rescanKey).text;
    const caution = dict.t(advice.cautionKey).text;
    const confidencePct = Math.round(confidence * 100);

    // FR-6.8: persist the uploaded image to Cloudinary first.
    let imageUrl: string;
    try {
      const upload = await uploadScanImage(
        inputBuffer,
        session.accountId,
        file.name,
      );
      imageUrl = upload.secure_url;
    } catch {
      // E17: Cloudinary failure aborts the scan.
      return errorResponse(
        "server_error",
        "Could not save image. Please try again.",
        503,
      );
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO detect_scans
         (account_id, image_url, disease_name, confidence, severity, crop, causes,
          treatment_steps, rescan_timing, caution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
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
      ],
    );

    return jsonResponse(
      {
        scanId: row?.id ?? null,
        diseaseName,
        confidence: confidencePct,
        severity: advice.severity,
        crop,
        causes,
        steps,
        rescanTiming,
        caution,
        imageUrl,
      } as const,
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
