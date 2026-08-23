import type { Locale } from "../lib/i18n/config.ts";
import { bal } from "./bal.ts";
import { en, type CatalogKey } from "./en.ts";
import { hno } from "./hno.ts";
import { pa } from "./pa.ts";
import { ps } from "./ps.ts";
import { sd } from "./sd.ts";
import { skr } from "./skr.ts";
import { ur } from "./ur.ts";

export type { CatalogKey } from "./en.ts";

/**
 * The typed translation catalog — authoring source of truth for every string
 * (plan K2). Synced into the Supabase `translations` table by
 * `scripts/sync-translations.mts`; the app itself reads the DB at runtime so
 * founder edits land without a redeploy (spec FR-10, FR-11).
 *
 * Language tables may be partial while copy is being drafted; the coverage
 * test fails until every locale mirrors the English key set.
 */
export const CATALOG: Readonly<Record<Locale, Partial<Record<CatalogKey, string>>>> = {
  en,
  ur,
  pa,
  ps,
  sd,
  skr,
  bal,
  hno,
};

export const CATALOG_KEYS: readonly CatalogKey[] = Object.keys(en) as CatalogKey[];

/** English table with empty/blank values removed — the fallback source. */
export const ENGLISH_TABLE: Readonly<Record<string, string>> = Object.fromEntries(
  CATALOG_KEYS
    .map((key) => [key, en[key]] as const)
    .filter(([, value]) => value.trim() !== ""),
);
