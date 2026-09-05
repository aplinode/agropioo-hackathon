/**
 * NDVI computation and PNG rendering.
 *
 * Reads two 16-bit raw GeoTIFF band buffers (Red B04 and NIR B08 from
 * Sentinel-2 L2A at 10 m), computes per-pixel NDVI, and renders a PNG
 * using the FR-5.1 colour scale.
 *
 * NDVI = (NIR − Red) / (NIR + Red)  →  range [−1, 1]
 */
import sharp from "sharp";
import { NDVI_LEGEND_BANDS } from "./types";

export interface NdviResult {
  pngBuffer: Buffer;
  meanNdvi: number;
}

/** Decode a raw 16-bit unsigned-int GeoTIFF band into a pixel array. */
export async function decodeBand(tiffBuffer: Buffer): Promise<Uint16Array> {
  const { data, info } = await sharp(tiffBuffer)
    .raw()
    .toFormat("raw", { depth: "ushort" as const })
    .toBuffer({ resolveWithObject: true });

  return new Uint16Array(data.buffer, data.byteOffset, data.length / 2);
}

/** Compute mean NDVI and render a colour-mapped PNG. */
export async function computeAndRenderNdvi(
  redBand: Uint16Array,
  nirBand: Uint16Array,
  width: number,
  height: number,
): Promise<NdviResult> {
  if (redBand.length !== nirBand.length) {
    throw new Error("Red and NIR bands must have the same pixel count");
  }

  const pixelCount = redBand.length;
  if (pixelCount !== width * height) {
    throw new Error(
      `Pixel count ${pixelCount} does not match dimensions ${width}x${height}`,
    );
  }

  let sum = 0;
  let validCount = 0;
  const rgba = Buffer.allocUnsafe(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = redBand[i];
    const nir = nirBand[i];

    if (r === 0 && nir === 0) {
      // No data — render transparent black
      rgba[i * 4] = 0;
      rgba[i * 4 + 1] = 0;
      rgba[i * 4 + 2] = 0;
      rgba[i * 4 + 3] = 0;
      continue;
    }

    const denom = nir + r;
    const ndvi = denom === 0 ? 0 : (nir - r) / denom;

    sum += ndvi;
    validCount++;

    const color = ndviToColor(ndvi);
    rgba[i * 4] = color.r;
    rgba[i * 4 + 1] = color.g;
    rgba[i * 4 + 2] = color.b;
    rgba[i * 4 + 3] = 255;
  }

  const meanNdvi = validCount > 0 ? sum / validCount : 0;

  const pngBuffer = await sharp(rgba, {
    raw: {
      width,
      height,
      channels: 4,
    },
  }).png().toBuffer();

  return { pngBuffer, meanNdvi: Math.round(meanNdvi * 1000) / 1000 };
}

/** Map an NDVI value to an RGBA colour using the legend bands. */
function ndviToColor(ndvi: number): { r: number; g: number; b: number } {
  const band = NDVI_LEGEND_BANDS.find((b) => ndvi >= b.min && ndvi < b.max);
  if (!band) {
    return hexToRgb(NDVI_LEGEND_BANDS[NDVI_LEGEND_BANDS.length - 1].color);
  }
  return hexToRgb(band.color);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r, g, b };
}
