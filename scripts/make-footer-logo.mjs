import sharp from "sharp";

const src = "references/Agropioo-logo-withoutbg-text.png";
const dst = "references/Agropioo-logo-footer.png";

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const px = Buffer.from(data);

for (let i = 0; i < px.length; i += 4) {
  if (px[i + 3] === 0) continue;
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];

  if (g > r + 10 && g > b + 10) {
    px[i] = Math.min(255, Math.round(r * 0.45 + 50));
    px[i + 1] = Math.min(255, Math.round(g * 0.6 + 115));
    px[i + 2] = Math.min(255, Math.round(b * 0.45 + 75));
  } else {
    px[i] = 238;
    px[i + 1] = 248;
    px[i + 2] = 242;
  }
}

await sharp(px, {
  raw: { width: info.width, height: info.height, channels: info.channels },
})
  .png()
  .toFile(dst);

console.log("written", dst);
