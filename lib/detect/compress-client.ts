/**
 * Client-side image compression (spec FR-1.4). Runs only in the browser —
 * this file is imported by the client component via a "use client" boundary
 * and must never reach the server bundle (it references OffscreenCanvas/Image).
 *
 * Reduces the longest side to 1024px at 80% JPEG quality before the image
 * is POSTed to /api/detect.
 */
export async function compressImageClient(
  file: File,
): Promise<{ blob: Blob; previewUrl: string }> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });

  const MAX = 1024;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    const ratio = Math.min(MAX / width, MAX / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl };
}
