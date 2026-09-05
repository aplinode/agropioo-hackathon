/**
 * Serwist service worker registration config (specs/offline-pwa/spec.md §FR-2–FR-5, §FR-16).
 *
 * @serwist/next is the docs-recommended PWA integration for Next.js 16.
 * This file defines the `runtimeCaching` array consumed by the SW entry point
 * (lib/serwist/sw.ts). The `withSerwistInit` wrapper in next.config.ts handles
 * precache manifest generation + SW bundling; `runtimeCaching` is applied at
 * runtime in the service worker itself.
 *
 * FR-2: root-scope SW intercepts all nav + GET /api requests.
 * FR-3: static assets → cache-first (precached at install).
 * FR-4: GET /api/* → network-first (24h max-age TTL, credentials include).
 * FR-15: SW fetches include credentials so cached API responses are per-user.
 */

import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from "serwist";
import type { RuntimeCaching } from "serwist";

const twentyFourHours = 24 * 60 * 60;

export const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: twentyFourHours,
          maxEntries: 100,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.destination === "image",
    handler: new CacheFirst({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 30 * twentyFourHours,
          maxEntries: 200,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.destination === "font",
    handler: new CacheFirst({
      cacheName: "fonts",
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 365 * twentyFourHours,
          maxEntries: 50,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) =>
      request.destination === "script" || request.destination === "style",
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 7 * twentyFourHours,
          maxEntries: 100,
        }),
      ],
    }),
  },
  {
    matcher: ({ url }) =>
      url.pathname.startsWith("/_next/data/") ||
      url.pathname.startsWith("/_next/static/"),
    handler: new StaleWhileRevalidate({
      cacheName: "next-data",
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 7 * twentyFourHours,
          maxEntries: 200,
        }),
      ],
    }),
  },
];

export default runtimeCaching;
