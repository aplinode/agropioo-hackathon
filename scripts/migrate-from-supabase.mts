/**
 * One-shot data migration: copies application data FROM Supabase (read via its
 * REST API using SUPABASE_URL + SUPABASE_ANON_KEY from .env) INTO Neon (the
 * app's current core DB, via lib/db / DATABASE_URL).
 *
 * Why REST instead of a direct Postgres connection: this session has no
 * Supabase MCP and .env only carries the Supabase project URL + anon key (no
 * direct Postgres password). The anon key can read every table that lacks
 * Row-Level Security (the auth tables) or has public-read policies (advisor
 * KB), which covers all the data we need.
 *
 * Behaviour:
 *  - Reads pages of 1000 rows from the Supabase REST API.
 *  - INSERT … ON CONFLICT (pk) DO NOTHING — a safe MERGE that never overwrites
 *    or duplicates Neon's existing rows, and NEVER deletes from either side.
 *  - Reconciles email collisions: if a Supabase user's email already exists in
 *    Neon, that user is skipped (already present) and any rows referencing the
 *    Supabase user id have their account_id remapped to the existing Neon user,
 *    so conversations/messages/farms/records stay attached.
 *  - Skips transient auth-state tables (pass_states, verification_codes,
 *    sessions) and translations (Neon's catalog-synced set is authoritative and
 *    has a stricter CHECK constraint Supabase rows would violate).
 *
 * Run:
 *  node --experimental-strip-types --env-file-if-exists=.env scripts/migrate-from-supabase.mts
 *
 * Requires: DATABASE_URL (Neon, target) + SUPABASE_URL + SUPABASE_ANON_KEY (source).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { query } from "../lib/db.ts";

// Load .env manually (mirrors other scripts' --env-file-if-exists behaviour).
const envPath = resolve(process.cwd(), ".env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const BASE = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_ANON_KEY ?? "";
if (!BASE || !KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" };

// Ordered by foreign-key dependency. PK + special-typed columns only.
const META: Record<string, { pk: string[]; jsonb?: Set<string>; vector?: Set<string> }> = {
  users: { pk: ["id"] },
  farms: { pk: ["id"], jsonb: new Set(["crops", "growth_stages"]) },
  records: { pk: ["id"], jsonb: new Set(["weather"]) },
  advisor_conversations: { pk: ["id"] },
  advisor_messages: { pk: ["id"] },
  advisor_knowledge_documents: { pk: ["id"] },
  advisor_knowledge_chunks: { pk: ["id"], vector: new Set(["embedding"]) },
  detect_scans: { pk: ["id"], jsonb: new Set(["treatment_steps"]) },
};

const ORDER = Object.keys(META);

// Collisions: supabaseUserId -> existing neonUserId.
const userRemap: Record<string, string> = {};
// Emails already present in Neon; their Supabase user rows are skipped.
const skipUserEmails = new Set<string>();

async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  const limit = 1000;
  let offset = 0;
  for (;;) {
    const res = await fetch(`${BASE}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${table} fetch failed (${res.status}): ${t.slice(0, 200)}`);
    }
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error(`${table} unexpected response: ${JSON.stringify(rows).slice(0, 200)}`);
    all.push(...rows);
    if (rows.length < limit) break;
    offset += limit;
  }
  return all;
}

function unionCols(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) set.add(k);
  return [...set];
}

function buildInsert(table: string, cols: string[], rows: Record<string, unknown>[]) {
  const meta = META[table];
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const conflict = meta.pk.map((c) => `"${c}"`).join(", ");
  const placeholders: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const row of rows) {
    const rp: string[] = [];
    for (const c of cols) {
      let ph = `$${i}`;
      let val: unknown = row[c] ?? null;
      if (c === "account_id" && typeof val === "string" && userRemap[val]) val = userRemap[val];
      if (val !== null && (meta.jsonb?.has(c) || meta.vector?.has(c)) && typeof val !== "string") {
        val = JSON.stringify(val);
      }
      if (meta.jsonb?.has(c)) ph += "::jsonb";
      else if (meta.vector?.has(c)) ph += "::vector";
      rp.push(ph);
      values.push(val);
      i += 1;
    }
    placeholders.push(`(${rp.join(", ")})`);
  }
  const sql = `INSERT INTO "${table}" (${colList}) VALUES ${placeholders.join(", ")} ON CONFLICT (${conflict}) DO NOTHING RETURNING "${meta.pk[0]}"`;
  return { sql, values };
}

async function copyTable(table: string): Promise<{ inserted: number; skipped: number; errored: number }> {
  let rows = await fetchAll(table);
  let preSkipped = 0;
  if (table === "users") {
    rows = rows.filter((r) => {
      const email = String(r.email ?? "").trim().toLowerCase();
      if (skipUserEmails.has(email)) {
        preSkipped += 1;
        return false;
      }
      return true;
    });
  }
  if (rows.length === 0) {
    console.log(`  • ${table}: 0 rows in Supabase — nothing to copy`);
    return { inserted: 0, skipped: preSkipped, errored: 0 };
  }
  const cols = unionCols(rows);
  let inserted = 0;
  let skipped = preSkipped;
  let errored = 0;

  const BATCH = 200;
  for (let o = 0; o < rows.length; o += BATCH) {
    const batch = rows.slice(o, o + BATCH);
    const { sql, values } = buildInsert(table, cols, batch);
    try {
      const res = await query<{ id: string }>(sql, values);
      inserted += res.length;
      skipped += batch.length - res.length;
    } catch (err) {
      console.warn(`    ! ${table} batch failed, retrying row-by-row: ${err instanceof Error ? err.message.split("\n")[0] : err}`);
      for (const row of batch) {
        const single = buildInsert(table, cols, [row]);
        try {
          const r = await query<{ id: string }>(single.sql, single.values);
          if (r.length > 0) inserted += 1;
          else skipped += 1;
        } catch (e) {
          errored += 1;
          console.warn(`    ! error on ${table} row: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
        }
      }
    }
  }
  console.log(`  • ${table}: ${inserted} inserted, ${skipped} skipped (already in Neon), ${errored} errored (of ${rows.length + preSkipped} in Supabase)`);
  return { inserted, skipped, errored };
}

async function main() {
  console.log("=== Supabase (REST) → Neon data migration ===\n");
  console.log(`Source: ${BASE}  (anon key)`);
  console.log(`Target: DATABASE_URL (Neon)\n`);

  // Build email-collision remap before copying anything.
  const neonUsers = await query<{ id: string; email: string }>(`SELECT id, email FROM users`);
  const neonEmails = new Set(neonUsers.map((u) => u.email.trim().toLowerCase()));
  const supaUsers = await fetchAll("users");
  for (const u of supaUsers) {
    const email = String(u.email ?? "").trim().toLowerCase();
    if (neonEmails.has(email)) {
      const neon = neonUsers.find((n) => n.email.trim().toLowerCase() === email);
      if (neon) {
        userRemap[String(u.id)] = neon.id;
        skipUserEmails.add(email);
      }
    }
  }
  if (skipUserEmails.size > 0) {
    console.log(`Detected ${skipUserEmails.size} Supabase user(s) with emails already in Neon — remapping their rows.\n`);
  }

  console.log(`Skipped: translations (Neon authoritative + stricter CHECK), ` +
    `pass_states/verification_codes/sessions (transient auth state)\n`);

  let total = 0;
  let totalErr = 0;
  for (const table of ORDER) {
    const r = await copyTable(table);
    total += r.inserted;
    totalErr += r.errored;
  }
  console.log(`\n=== Done. ${total} rows merged into Neon (${totalErr} errored). ===`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
