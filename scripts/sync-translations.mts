/**
 * Syncs catalog/ (typed source of truth) into the Neon `translations`
 * table — plan K2. Idempotent full-matrix upsert: every English key gets a
 * row in every locale; untranslated keys are stored as status 'missing' with
 * a NULL value so coverage is countable (spec FR-13).
 *
 * Requires DATABASE_URL. Run: npm run sync:translations
 */
import { query } from "../lib/db.ts";

import { CATALOG, CATALOG_KEYS } from "../catalog/index.ts";
import { LOCALES } from "../lib/i18n/config.ts";

interface Row {
  key: string;
  locale: string;
  value: string | null;
  status: "translated" | "missing";
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
  const values: unknown[] = [];
  const placeholders: string[] = [];
  let idx = 1;
  for (const row of chunk) {
    placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3})`);
    values.push(row.key, row.locale, row.value, row.status);
    idx += 4;
  }

  try {
    await query(
      `INSERT INTO translations (key, locale, value, status)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (key, locale)
       DO UPDATE SET value = EXCLUDED.value, status = EXCLUDED.status, updated_at = now()`,
      values
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Upsert failed for rows ${i}–${i + chunk.length}:`, message);
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
