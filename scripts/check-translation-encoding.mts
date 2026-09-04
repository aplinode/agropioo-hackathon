import { query } from "../lib/db.ts";

const rows = await query<{ key: string; locale: string; value: string; hex: string }>(
  `SELECT key, locale, value, encode(value::bytea, 'hex') AS hex
   FROM translations
   WHERE locale = 'ur' AND key IN ('nav.whyAgropioo', 'nav.signIn', 'hero.title')
   LIMIT 6`
);

for (const r of rows) {
  console.log(`\n[${r.locale}] ${r.key}`);
  console.log(`  value: ${r.value}`);
  console.log(`  hex:   ${r.hex}`);
  // Check if first bytes are valid UTF-8 Arabic block (U+0600-U+06FF = D8XX range in UTF-8)
  const firstBytes = r.hex.substring(0, 8);
  console.log(`  first 4 bytes: ${firstBytes}`);
}

// Also check server encoding
const enc = await query<{ server_encoding: string }>(
  `SELECT pg_encoding_to_char(encoding) AS server_encoding FROM pg_database WHERE datname = current_database()`
);
console.log(`\nDB server_encoding: ${enc[0]?.server_encoding}`);
