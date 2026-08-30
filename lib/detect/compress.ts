import sharp from "sharp";

/**
 * Resize an image buffer to the 384×384 RGB input the EfficientNetV2s
 * disease model expects (spec FR-8.3, plan D9/T8). The client already
 * downscales to ~1024px, so this is a final deterministic resize before
 * the Hugging Face call.
 */
export async function resizeForModel(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(384, 384, { fit: "inside", withoutReduction: false })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/** Best-effort content-type sniff from a file extension or octet-stream. */
export function extensionToMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] ?? "application/octet-stream";
}

export function isImageMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png" || mime === "image/webp" || mime === "image/gif";
}
