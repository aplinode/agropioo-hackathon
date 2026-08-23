import "server-only";

import { cache } from "react";
import { locale as rootLocale } from "next/root-params";

import { CATALOG, ENGLISH_TABLE, type CatalogKey } from "@/catalog";
import { isLocale } from "./config";
import { getSupabase } from "@/lib/supabase";

import type { Locale } from "./config";
import { formatMessage } from "./logic";
import { resolveString, type ResolvedString, type StringTable } from "./logic";

export interface Translator {
  (key: CatalogKey, params?: Readonly<Record<string, string | number>>): ResolvedString;
}

export interface Dictionary {
  locale: Locale;
  t: Translator;
}

function buildTable(
  rows: readonly { key: string; value: string | null }[],
): StringTable {
  const table: Record<string, string> = {};
  for (const row of rows) {
    if (typeof row.value === "string" && row.value.trim() !== "") {
      table[row.key] = row.value;
    }
  }
  return table;
}

/**
 * Loads the dictionary for one locale from the DB catalog. Rendered
 * dynamically with per-request dedupe via React cache() — no cross-request
 * cache, so founder SQL edits are visible on the very next request (AC-6).
 * If Supabase is unreachable we degrade to the build-time catalog so pages
 * still render English (+ drafted copy) instead of erroring.
 */
export const getDictionary = cache(async (localeCode: Locale): Promise<Dictionary> => {
  let primary: StringTable = fallbackTableFor(localeCode);
  let english: StringTable = ENGLISH_TABLE;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("translations")
      .select("key,locale,value")
      .in("locale", [localeCode, "en"])
      .eq("status", "translated");

    if (!error && data) {
      const localizedRows: { key: string; value: string | null }[] = [];
      const englishRows: { key: string; value: string | null }[] = [];
      for (const row of data) {
        if (row.locale === localeCode) localizedRows.push(row);
        else englishRows.push(row);
      }
      primary = buildTable(localizedRows);
      const dbEnglish = buildTable(englishRows);
      // Prefer DB English when present; keep catalog entries as extra safety.
      english = { ...ENGLISH_TABLE, ...dbEnglish };
    }
  } catch {
    // Supabase unavailable — keep the build-time fallback tables.
  }

  const t: Translator = (key, params) => {
    const resolved = resolveString(primary, english, key);
    const text =
      params === undefined ? resolved.text : formatMessage(resolved.text, params);
    return { text, isFallback: resolved.isFallback };
  };

  return { locale: localeCode, t };
});

/** Build-time drafted copy for a locale merged over the English source of truth. */
function fallbackTableFor(localeCode: Locale): StringTable {
  const drafted = CATALOG[localeCode] ?? {};
  const table: Record<string, string> = { ...ENGLISH_TABLE };
  for (const [key, value] of Object.entries(drafted)) {
    if (typeof value === "string" && value.trim() !== "") table[key] = value;
  }
  return table;
}

/**
 * Dictionary for whichever locale the URL carries — the standard entry point
 * for pages under app/[locale]. Unprefixed rewrites resolve to "en".
 */
export async function getCurrentDictionary(): Promise<Dictionary> {
  const raw = await rootLocale();
  return getDictionary(isLocale(raw) ? raw : "en");
}

/** Flat prop bundle for the client SiteHeader (functions can't cross the RSC boundary). */
export function siteHeaderStrings(t: Translator) {
  return {
    whyAgropioo: t("nav.whyAgropioo").text,
    features: t("nav.features").text,
    howItWorks: t("nav.howItWorks").text,
    vision: t("nav.vision").text,
    signIn: t("nav.signIn").text,
    getEarlyAccess: t("nav.getEarlyAccess").text,
    openMenu: t("nav.openMenu").text,
    closeMenu: t("nav.closeMenu").text,
    languageSwitcher: t("common.languageSwitcherLabel").text,
  };
}
