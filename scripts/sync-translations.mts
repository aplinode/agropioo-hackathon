/**
 * Syncs catalog/ (typed source of truth) into the Supabase `translations`
 * table — plan K2. Idempotent full-matrix upsert: every English key gets a
 * row in every locale; untranslated keys are stored as status 'missing' with
 * a NULL value so coverage is countable (spec FR-13).
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role bypasses
 * RLS; the anon key cannot write). Run: npm run sync:translations
 */
import { getSupabaseAdmin } from "../lib/supabase.ts";

import { CATALOG, CATALOG_KEYS } from "../catalog/index.ts";
import { LOCALES } from "../lib/i18n/config.ts";

interface Row {
  key: string;
  locale: string;
  value: string | null;
  status: "translated" | "missing";
}

let supabase;
try {
  supabase = getSupabaseAdmin();
} catch {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env, then re-run.",
  );
  process.exit(1);
}

const rows: Row[] = [];
for (const locale of LOCALES) {
  const table = CATALOG[locale];
  for (const key of CATALOG_KEYS) {
    const raw = table[key];
    const value = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
    rows.push({ key, locale, value, status: value ? "translated" : "missing" });
  }
}

const CHUNK = 500;
let translated = 0;
let missing = 0;

for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supabase
    .from("translations")
    .upsert(chunk, { onConflict: "key,locale" });
  if (error) {
    console.error(`Upsert failed for rows ${i}–${i + chunk.length}:`, error.message);
    process.exit(1);
  }
}

for (const row of rows) {
  if (row.status === "translated") translated += 1;
  else missing += 1;
}

console.log(
  `Synced ${rows.length} rows across ${LOCALES.length} locales ` +
    `(${CATALOG_KEYS.length} keys): ${translated} translated, ${missing} missing.`,
);

if (missing > 0) {
  const byLocale = LOCALES.map((locale) => {
    const count = rows.filter((row) => row.locale === locale && row.status === "missing").length;
    return `${locale}: ${count}`;
  }).join(", ");
  console.log(`Coverage gaps → ${byLocale}`);
}
