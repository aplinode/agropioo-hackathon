/**
 * Service worker entry point for Serwist (specs/offline-pwa/spec.md §6).
 * This file is compiled into /sw.js by Serwist during the build.
 *
 * The SW registers runtime caching routes defined in lib/serwist/config.ts.
 * Offline fallback is served via the cache for navigation requests.
 */
