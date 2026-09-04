/**
 * POST /api/prices/ingest — daily price ingestion.
 *
 * Invoked by the free GitHub Actions cron (`.github/workflows/mandi-cron.yml`)
 * which scrapes the four official provincial portals + the PBS Weekly SPI
 * XLSX and POSTs each batch here. See `specs/002-mandi-price-tracker/contracts/api-contracts.md`
 * for the full contract; this route enforces:
 *   - bearer auth via `PRICES_CRON_SECRET` env var
 *   - per-IP rate limit of 10 req/min
 *   - Zod validation of the batch
 *   - upsert into `mandi_prices` (single source of truth — no admin channel)
 *   - audit row in `scraper_runs`
 *   - post-ingest alert evaluation (unchanged from prior implementation)
 */

import { z } from "zod";
import { evaluateAndDispatchAlerts } from "@/lib/prices/alerts";
import {
  clientIp,
  errorResponse,
  jsonResponse,
  rateLimit,
  readJsonBody,
} from "@/lib/http";
import { query, withTransaction } from "@/lib/db";

const SOURCE_CODES = [
  "amis_pk",
  "samis_pk",
  "fmis_kp",
  "bmis_balochistan",
  "pbs_spi",
] as const;

const ingestBatchSchema = z.object({
  source_code: z.enum(SOURCE_CODES),
  scraped_at: z.string().datetime(),
  rows: z
    .array(
      z.object({
        mandi_external_id: z.string().min(1),
        crop_external_id: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        modal_price: z.number().positive(),
        min_price: z.number().positive(),
        max_price: z.number().positive(),
        unit: z.literal("Maund"),
        is_holiday: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(5000),
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.PRICES_CRON_SECRET;
  if (!secret) {
    return errorResponse(
      "server_error",
      "PRICES_CRON_SECRET is not configured on the server",
      500,
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return errorResponse("unauthorized", "Unauthorized", 401);
  }

  const ip = clientIp(request);
  const limit = rateLimit(`prices-ingest:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return errorResponse(
      "rate_limited",
      `Too many requests; retry in ${limit.retryAfterSec}s`,
      429,
    );
  }

  const body = await readJsonBody(request);
  const parsed = ingestBatchSchema.safeParse(body);
  if (!parsed.success) {
    try {
      await query(
        `insert into scraper_runs (source_code, status, rows_written, rows_rejected, caller_ip)
         values ($1, 'unauthorized', 0, 0, $2)`,
        ["amis_pk", ip],
      );
    } catch {
      /* audit table may not exist on first run; swallow */
    }
    return errorResponse(
      "validation_error",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      400,
    );
  }

  const { source_code, rows } = parsed.data;
  let written = 0;
  let rejected = 0;
  let auditStatus: "ok" | "partial" | "server_error" = "ok";

  try {
    const mandiRows = await query<{ id: string; district: string }>(
      `select id, district from mandis`,
    );
    const mandiByExternalId = new Map(
      mandiRows.map((m) => [m.id, m] as const),
    );

    const cropRows = await query<{ id: string }>(`select id from crops`);
    const cropIds = new Set(cropRows.map((c) => c.id));

    await withTransaction(async (client) => {
      for (const row of rows) {
        const mandiId = mandiByExternalId.get(row.mandi_external_id)
          ? row.mandi_external_id
          : null;
        if (!mandiId || !cropIds.has(row.crop_external_id)) {
          rejected++;
          continue;
        }
        await client.query(
          `insert into mandi_prices
             (mandi_id, crop_id, date, modal_price, min_price, max_price, unit, source, source_code, is_holiday)
           values ($1,$2,$3,$4,$5,$6,'Maund','govt_api',$7,$8)
           on conflict (mandi_id, crop_id, date, source_code) do update set
             modal_price=excluded.modal_price,
             min_price=excluded.min_price,
             max_price=excluded.max_price,
             is_holiday=excluded.is_holiday,
             source=excluded.source,
             source_code=excluded.source_code`,
          [
            mandiId,
            row.crop_external_id,
            row.date,
            row.modal_price,
            row.min_price,
            row.max_price,
            source_code,
            row.is_holiday,
          ],
        );
        written++;
      }
    });

    if (rejected > 0) auditStatus = "partial";
  } catch (err) {
    auditStatus = "server_error";
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/prices/ingest error:", message);
    try {
      await query(
        `insert into scraper_runs (source_code, status, rows_written, rows_rejected, caller_ip)
         values ($1, 'server_error', 0, 0, $2)`,
        [source_code, ip],
      );
    } catch {
      /* audit table may not exist on first run; swallow */
    }
    return errorResponse("server_error", message, 500);
  }

  await query(
    `insert into scraper_runs (source_code, status, rows_written, rows_rejected, caller_ip)
     values ($1, $2, $3, $4, $5)`,
    [source_code, auditStatus, written, rejected, ip],
  );

  let alerts: { evaluated: number; triggered: number } | null = null;
  try {
    alerts = await evaluateAndDispatchAlerts(new Date());
  } catch (err) {
    console.error("Alert evaluation failed after ingest:", err);
  }

  return jsonResponse({
    success: true,
    request_id: crypto.randomUUID(),
    rows_written: written,
    rows_rejected: rejected,
    ingested_at: new Date().toISOString(),
    source_code,
    alerts_evaluated: alerts?.evaluated ?? 0,
    alerts_triggered: alerts?.triggered ?? 0,
  });
}
