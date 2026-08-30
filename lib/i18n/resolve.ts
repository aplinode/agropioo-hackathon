/**
 * Non-cached translation resolver for Route Handlers (plan T9 step 10).
 * React's `cache()`-bound helpers in lib/i18n/server are tuned for the RSC
 * render tree; this module gives handlers a safe, per-request-resolving,
 * DB-backed translator that fetches only the keys a response needs.
 */

import "server-only";

import { ENGLISH_TABLE, type CatalogKey } from "@/catalog";
import { query } from "@/lib/db";
import { formatMessage } from "./logic";
import { resolveString } from "./logic";
import { fallbackTableFor } from "./server";

import { cookies } from "next/headers";
import { APP_LOCALE_COOKIE, DEFAULT_LOCALE, isLocale } from "./config";

import type { Locale } from "./config";

export interface ResolvedString {
  text: string;
  isFallback: boolean;
}

export interface FastDictionary {
  locale: Locale;
  /** Resolve one key (no params). */
  t(key: CatalogKey): ResolvedString;
  /** Resolve one key with placeholder params. */
  t(key: CatalogKey, params: Readonly<Record<string, string | number>>): ResolvedString;
}

/**
 * The farmer-app display language for the current request, read straight
 * from the persisted preference cookie (safe to call from any server context,
 * unlike the cache()-bound getAppLocale).
 */
export async function requestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(APP_LOCALE_COOKIE)?.value;
  const candidate = raw ?? DEFAULT_LOCALE;
  return isLocale(candidate) ? candidate : DEFAULT_LOCALE;
}

/**
 * Build a dictionary for `locale` by layering, in order:
 *   1. English source (ENGLISH_TABLE)
 *   2. build-time catalog draft for the locale (e.g. Urdu UI copy)
 *   3. live DB rows for the locale with status 'translated'
 * Missing keys fall back to English. Database failure degrades gracefully
 * to the catalog tables so pages still render.
 */
export async function getFastDictionary(locale: Locale): Promise<FastDictionary> {
  const primary = fallbackTableFor(locale);

  try {
    const rows = await query<{ key: string; value: string | null }>(
      `SELECT key, value FROM translations
       WHERE locale = $1 AND status = 'translated'`,
      [locale],
    );
    for (const row of rows) {
      if (typeof row.value === "string" && row.value.trim() !== "") {
        (primary as Record<string, string>)[row.key] = row.value;
      }
    }
  } catch {
    // DB unavailable — keep the catalog fallback table.
  }

  const t = (
    key: CatalogKey,
    params?: Readonly<Record<string, string | number>>,
  ): ResolvedString => {
    const resolved = resolveString(primary, ENGLISH_TABLE, key);
    const text =
      params === undefined ? resolved.text : formatMessage(resolved.text, params);
    return { text, isFallback: resolved.isFallback };
  };

  return { locale, t };
}
