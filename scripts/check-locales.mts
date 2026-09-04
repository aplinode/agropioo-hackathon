import { query } from "../lib/db.ts";

const locales = ["pa", "ps", "sd", "skr", "bal", "hno"];

for (const loc of locales) {
  const rows = await query<{ key: string; locale: string; value: string }>(
    `SELECT key, locale, value FROM translations WHERE locale = $1 AND key = 'nav.whyAgropioo' LIMIT 1`,
    [loc]
  );
  if (rows[0]) {
    console.log(`[${rows[0].locale}] ${rows[0].value}`);
  } else {
    console.log(`[${loc}] NO DATA for nav.whyAgropioo`);
  }
}

// Check if these locales have ANY translated rows
for (const loc of locales) {
  const count = await query<{ count: string }>(
    `SELECT count(*) AS count FROM translations WHERE locale = $1 AND status = 'translated'`,
    [loc]
  );
  console.log(`[${loc}] translated rows: ${count[0]?.count ?? 0}`);
}
