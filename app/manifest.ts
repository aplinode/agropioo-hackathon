/**
 * Web app manifest (specs/offline-pwa/spec.md §6).
 * Next.js 16 renders this via app/manifest.ts — it generates
 * /manifest.webmanifest and injects the <link rel="manifest"> tag.
 */

export const manifest = {
  name: "Agropioo — Farm Intelligence",
  short_name: "Agropioo",
  description:
    "AI-powered farm intelligence for Pakistani farmers: weather, records, disease detection, and market prices — offline capable.",
  start_url: "/",
  display: "standalone" as const,
  background_color: "#ffffff",
  theme_color: "#F0FDF4",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/icon.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};
