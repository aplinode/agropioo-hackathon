/**
 * NDVI job orchestrator.
 *
 * Orchestrates the full pipeline:
 *  1. Find the clearest Sentinel-2 scene over the boundary bbox
 *  2. Download Red (B04) and NIR (B08) bands
 *  3. Decode bands, compute NDVI per pixel, render PNG
 *  4. Upload PNG to Cloudinary
 *  5. Insert snapshot record
 *  6. Update job status
 *
 * Handles two failure modes per spec:
 *  - No clear scene found → insert a cloud-covered snapshot (cloudCover=true)
 *  - Any other error → mark job as failed with error message
 */
import type { FieldBoundary } from "./types";
import sharp from "sharp";
import { findClearScene, downloadBand } from "./copernicus";
import { decodeBand, computeAndRenderNdvi } from "./ndvi";
import { uploadNdviImage } from "./cloudinary";
import * as jobs from "./jobs";
import { bboxFromGeojson } from "./types";

export async function processNdviJob(jobId: string, boundary: FieldBoundary): Promise<void> {
  const bbox = bboxFromGeojson(boundary.geojson);
  const today = new Date().toISOString().split("T")[0];

  await jobs.updateJobStatus(jobId, "processing");

  let scene;
  try {
    scene = await findClearScene(boundary.geojson, 0.3, 14);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await jobs.updateJobStatus(jobId, "failed", msg);
    throw err;
  }

  if (!scene) {
    // FR-5.3: no clear scene → insert cloud-covered placeholder snapshot
    // Re-use today's date; the client will show "No clear imagery"
    await jobs.insertSnapshot(
      boundary.id,
      boundary.accountId,
      today,
      0,
      true,
      "",
      boundary.areaHa,
    );
    await jobs.updateJobStatus(jobId, "completed");
    return;
  }

  let redBand, nirBand;
  try {
    [redBand, nirBand] = await Promise.all([
      downloadBand(scene.id, "B04", bbox),
      downloadBand(scene.id, "B08", bbox),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await jobs.updateJobStatus(jobId, "failed", msg);
    throw err;
  }

  try {
    const redPixels = await decodeBand(redBand);
    const nirPixels = await decodeBand(nirBand);

    // Sentinel-2 10 m bands tile as a grid; we infer dimensions from pixel count.
    // The actual width/height depends on the tile — for simplicity, decode
    // the image dimensions from the TIFF metadata.
    const metadata = await inferDimensions(redBand);
    const { pngBuffer, meanNdvi } = await computeAndRenderNdvi(
      redPixels,
      nirPixels,
      metadata.width,
      metadata.height,
    );

    const imageUrl = await uploadNdviImage(pngBuffer, boundary.id, scene.datetime.split("T")[0] ?? today);

    const snapshotDate = scene.datetime.split("T")[0] ?? today;
    await jobs.insertSnapshot(
      boundary.id,
      boundary.accountId,
      snapshotDate,
      meanNdvi,
      false,
      imageUrl,
      boundary.areaHa,
    );

    await jobs.updateJobStatus(jobId, "completed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await jobs.updateJobStatus(jobId, "failed", msg);
    throw err;
  }
}

interface ImageDimensions {
  width: number;
  height: number;
}

/** Infer width/height from a GeoTIFF buffer using sharp metadata. */
async function inferDimensions(tiffBuffer: Buffer): Promise<ImageDimensions> {
  const meta = await sharp(tiffBuffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not infer GeoTIFF dimensions");
  }
  return { width: meta.width, height: meta.height };
}
