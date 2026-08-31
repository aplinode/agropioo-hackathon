/**
 * Cloudinary upload utility for scan images (spec FR-6.8, plan D1/T7).
 * Server-side only — the SDK is configured from env vars read at import
 * time, so keys never reach the client.
 */

import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a compressed scan image into the per-user folder
 * `scans/user_{accountId}/`. Resolves with the HTTPS URL to store in
 * `detect_scans.image_url`.
 */
export async function uploadScanImage(
  buffer: Buffer,
  accountId: string,
  filename: string,
): Promise<UploadResult> {
  const safeName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const publicId = `scan_${safeName ? safeName + "_" : ""}${Date.now()}_${randomUUID().slice(0, 8)}`;

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `scans/user_${accountId}`,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      },
      (err, result) => {
        if (err) {
          console.error("[CLOUDINARY] Upload error:", err);
          reject(new Error(`Cloudinary upload failed: ${err.message}`));
          return;
        }
        const res = result as { secure_url?: string; public_id?: string };
        if (!res.secure_url) {
          console.error("[CLOUDINARY] No secure_url in response:", result);
          reject(new Error("Cloudinary upload returned no URL"));
          return;
        }
        resolve({ secure_url: res.secure_url, public_id: res.public_id ?? publicId });
      },
    );
    stream.end(buffer);
  });
}
