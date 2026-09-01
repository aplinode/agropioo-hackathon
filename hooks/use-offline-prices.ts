"use client";

import { useEffect, useCallback } from "react";

const STORAGE_PREFIX = "agropioo:prices:";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type CacheEntry<T> = {
  ts: number;
  data: T;
};

function cacheKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > TTL_MS) {
      window.localStorage.removeItem(cacheKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { ts: Date.now(), data };
    window.localStorage.setItem(cacheKey(key), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently skip.
  }
}

function evictExpired(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k?.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as CacheEntry<unknown>;
        if (Date.now() - entry.ts > TTL_MS) toRemove.push(k);
      } catch {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // Storage unavailable.
  }
}

/**
 * Read + write wrapper for offline price caching.
 *
 * Usage:
 *   const { read, write } = useOfflinePrices();
 *   const cached = read<MandiPrice[]>("prices:wheat");
 *   write("prices:wheat", freshData);
 *
 * Keys are arbitrary strings; the hook prefixes them automatically.
 * Stale entries (>6 h) are evicted on mount.
 */
export function useOfflinePrices() {
  // Evict expired entries once on mount.
  useEffect(() => {
    evictExpired();
  }, []);

  const read = useCallback(<T>(key: string): T | null => readCache<T>(key), []);
  const write = useCallback(<T>(key: string, data: T): void => writeCache(key, data), []);

  return { read, write };
}
