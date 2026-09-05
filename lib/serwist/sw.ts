/**
 * Service worker entry point for Serwist (specs/offline-pwa/spec.md §FR-2–FR-5, §FR-16).
 * This file is compiled into /sw.js by @serwist/next's InjectManifest webpack
 * plugin during the build (triggered via `withSerwistInit` in next.config.ts).
 *
 * Serwist injects the precache manifest via `self.__WB_MANIFEST`.
 * Runtime caching routes are defined in lib/serwist/config.ts.
 *
 * FR-16: on SW activation, outdated caches are cleaned up.
 * EC-1: navigation fallback serves the locale-aware /offline page when no
 *       cached route exists.
 */

import { Serwist, type PrecacheEntry } from "serwist";
import { runtimeCaching } from "./config";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[];
};

const sw = new Serwist({
  precacheEntries: (self.__WB_MANIFEST ?? []) as (string | PrecacheEntry)[],
  precacheOptions: {
    navigateFallback: "/offline",
    cleanupOutdatedCaches: true,
  },
  runtimeCaching,
  skipWaiting: true,
  clientsClaim: true,
});

sw.addEventListeners();
