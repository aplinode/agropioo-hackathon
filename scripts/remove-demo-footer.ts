import { query } from "../lib/db";

interface DeleteRow {
  key: string;
  locale: string;
}

async function main() {
  const result = await query<DeleteRow>(
    "DELETE FROM translations WHERE key = $1 RETURNING key, locale",
    ["app.dashboard.demoFooter"]
  );
  console.log(`Deleted ${result.length} rows:`, result);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
