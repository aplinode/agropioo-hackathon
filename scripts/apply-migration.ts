/**
 * Applies the advisor migration (0003_advisor.sql) to the Supabase project.
 * Uses the Supabase Management API to execute raw SQL — the JS client
 * cannot run DDL (CREATE TABLE, CREATE EXTENSION).
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN — from https://supabase.com/dashboard/account/tokens
 *   or SUPABASE_SERVICE_ROLE_KEY — used as a bearer token for the SQL endpoint
 *
 * Run: node --experimental-strip-types --env-file-if-exists=.env scripts/apply-migration.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_REF = process.env.SUPABASE_URL?.match(
  /https:\/\/([^.]+)\.supabase\.co/,
)?.[1];

if (!PROJECT_REF) {
  console.error("Could not extract project ref from SUPABASE_URL");
  process.exit(1);
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!accessToken && !serviceRoleKey) {
  console.error(
    "Need either SUPABASE_ACCESS_TOKEN (from supabase.com/dashboard/account/tokens)\n" +
      "or SUPABASE_SERVICE_ROLE_KEY (from Project Settings > API).\n" +
      "Add one to .env and re-run.",
  );
  process.exit(1);
}

const sqlPath = resolve(
  import.meta.dirname ?? ".",
  "../supabase/migrations/0003_advisor.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

console.log(`Applying migration to project ${PROJECT_REF}...`);
console.log(`SQL file: ${sqlPath}`);
console.log(`SQL length: ${sql.length} chars`);

async function applyViaManagementAPI() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`Management API error (${res.status}): ${body}`);
    process.exit(1);
  }

  console.log("Migration applied successfully via Management API!");
}

async function applyViaSQLService() {
  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`SQL service error (${res.status}): ${body}`);
    console.error(
      "\nThe exec_sql RPC function may not exist. Try the Management API instead:\n" +
        "1. Generate a token at https://supabase.com/dashboard/account/tokens\n" +
        "2. Add SUPABASE_ACCESS_TOKEN=your_token to .env\n" +
        "3. Re-run this script",
    );
    process.exit(1);
  }

  console.log("Migration applied successfully!");
}

if (accessToken) {
  await applyViaManagementAPI();
} else {
  await applyViaSQLService();
}
