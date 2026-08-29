/**
 * Diagnostic script for the /api/detect flow.
 * Tests each stage independently to identify where failure occurs.
 */

import sharp from "sharp";
import { uploadScanImage } from "../lib/detect/cloudinary.ts";

const TEST_ACCOUNT_ID = "test-account-123";

async function createTestImage(): Promise<Buffer> {
  console.log("[DIAG] Creating test image...");
  const buffer = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 34, g: 139, b: 34 },
    },
  })
    .jpeg()
    .toBuffer();
  console.log(`[DIAG] Test image created: ${buffer.length} bytes`);
  return buffer;
}

async function testResize(buffer: Buffer): Promise<Buffer> {
  console.log("[DIAG] Testing resize...");
  const resized = await sharp(buffer)
    .resize(384, 384, { fit: "inside", withoutReduction: false })
    .jpeg({ quality: 85 })
    .toBuffer();
  console.log(`[DIAG] Resize success: ${resized.length} bytes`);
  return resized;
}

async function testCloudinary(buffer: Buffer) {
  console.log("[DIAG] Testing Cloudinary upload...");
  console.log(`[DIAG] Cloudinary cloud_name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`[DIAG] Cloudinary api_key present: ${!!process.env.CLOUDINARY_API_KEY}`);
  console.log(`[DIAG] Cloudinary api_secret present: ${!!process.env.CLOUDINARY_API_SECRET}`);
  try {
    const result = await uploadScanImage(buffer, TEST_ACCOUNT_ID, "test-image.jpg");
    console.log(`[DIAG] Cloudinary success! URL: ${result.secure_url}`);
    return result;
  } catch (err) {
    console.error("[DIAG] Cloudinary FAILED:", err);
    throw err;
  }
}

async function main() {
  console.log("=== /api/detect Diagnostic ===\n");

  try {
    const imageBuffer = await createTestImage();
    await testResize(imageBuffer);

    console.log("\n--- Testing Cloudinary ---");
    await testCloudinary(imageBuffer);

    console.log("\n=== All tests passed ===");
  } catch (err) {
    console.error("\n=== DIAGNOSTIC FAILED ===");
    console.error(err);
    process.exit(1);
  }
}

main();
