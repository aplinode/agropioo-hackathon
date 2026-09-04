/**
 * Serwist service worker registration config (specs/offline-pwa/spec.md §6).
 *
 * Serwist is the Next.js 16 recommended PWA library (see
 * node_modules/next/dist/docs/01-app/.../useOffline.md).
 * It must be installed as a dev dependency: `npm i -D @serwist/next`.
 *
 * This config is consumed by Serwist during the build to generate /sw.js.
 */

const swConfig = {
  swDest: "/sw.js",
  swSrc: "/lib/serwist/sw.ts",
  globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2}"],
  cacheEverything: false,
  compileForSize: process.env.NODE_ENV === "production",
  runtimeCaching: [
    {
      urlPattern: ({ pathname }: { pathname: string }) => pathname.startsWith("/api/"),
      runtimeCaching: "networkOnly",
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.destination === "image",
      runtimeCaching: "cacheFirst",
      cacheName: "images",
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.destination === "font",
      runtimeCaching: "cacheFirst",
      cacheName: "fonts",
    },
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.destination === "script" || request.destination === "style",
      runtimeCaching: "networkFirst",
      cacheName: "static-assets",
    },
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/_next/data/") || url.pathname.startsWith("/_next/static/"),
      runtimeCaching: "staleWhileRevalidate",
      cacheName: "next-data",
    },
  ],
};

export default swConfig;
export type SerwistConfig = typeof swConfig;
