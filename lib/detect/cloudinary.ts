/**
 * Cloudinary upload utility for scan images (spec FR-6.8, plan D1/T7).
 * Server-side only — the SDK is configured from env vars read at import
 * time, so keys never reach the client.
 */

import { v2 as cloudinary } from "cloudinary";

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
  const publicId = filename.replace(/\.[^.]+$/, "");

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `scans/user_${accountId}`,
        public_id: publicId,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        const res = result as { secure_url?: string; public_id?: string };
        if (!res.secure_url) {
          reject(new Error("Cloudinary upload returned no URL"));
          return;
        }
        resolve({ secure_url: res.secure_url, public_id: res.public_id ?? publicId });
      },
    );
    stream.end(buffer);
  });
}
