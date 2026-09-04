import { query } from "../lib/db.ts";

const locales = ["en", "pa", "ps", "sd", "skr", "bal", "hno"];

// Check crop keys for each locale
for (const loc of locales) {
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM translations WHERE locale = $1 AND key LIKE 'app.crops%' LIMIT 3`,
    [loc]
  );
  console.log(`\n=== ${loc} ===`);
  for (const row of rows) {
    console.log(`  ${row.key}: ${row.value}`);
  }
}

// Count untranslated vs translated crop keys per locale
for (const loc of locales) {
  const all = await query<{ value: string }>(
    `SELECT value FROM translations WHERE locale = $1 AND key LIKE 'app.crops%'`,
    [loc]
  );
  const untranslated = all.filter(r => /^[A-Z]/.test(r.value) && !/[^\x00-\x7F]/.test(r.value));
  console.log(`[${loc}] crop keys: ${all.length}, English-only: ${untranslated.length}`);
}

process.exit(0);
