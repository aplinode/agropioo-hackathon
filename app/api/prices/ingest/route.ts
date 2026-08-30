/**
 * POST /api/prices/ingest — daily price ingestion and alert evaluation.
 * Intended to be triggered by GitHub Actions cron or admin process.
 */

import { evaluateAndDispatchAlerts } from "@/lib/prices/alerts";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function POST(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.PRICES_CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return errorResponse("unauthorized", "Unauthorized", 401);
  }

  try {
    const result = await evaluateAndDispatchAlerts(new Date());
    return jsonResponse({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/prices/ingest error:", message);
    return errorResponse("server_error", message, 500);
  }
}
