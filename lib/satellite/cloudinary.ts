/**
 * Cloudinary upload for NDVI heatmap PNGs.
 *
 * Reuses the existing Cloudinary config pattern from lib/detect/cloudinary.ts.
 * Images get a deterministic public_id so retries don't duplicate uploads:
 *   satellite/boundary_{boundaryId}_{snapshotDate}
 */
import { v2 as cloudinary } from "cloudinary";

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadNdviImage(
  pngBuffer: Buffer,
  boundaryId: string,
  snapshotDate: string,
): Promise<string> {
  const publicId = `satellite/boundary_${boundaryId}_${snapshotDate.replace(/-/g, "")}`;

  const result: UploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          folder: "agropioo",
          resource_type: "image",
          type: "upload",
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as unknown as UploadResult);
        },
      )
      .end(pngBuffer);
  });

  return result.secure_url;
}
