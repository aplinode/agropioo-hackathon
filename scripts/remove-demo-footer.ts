import { query } from "../lib/db";

async function main() {
  const result = await query(
    "DELETE FROM translations WHERE key = $1 RETURNING key, locale",
    ["app.dashboard.demoFooter"]
  );
  console.log(`Deleted ${result.rowCount} rows:`, result.rows);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
