/**
 * GET /api/detect/history — list a farmer's saved scans (spec FR-6.5, FR-6.7;
 * plan T10). Cursor-based pagination, newest-first, scoped to the account.
 */

import { query } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";
import { z } from "zod";
import type { Severity } from "@/lib/detect/plantvillage-map";

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) {
    return errorResponse("unauthorized", "Sign in to use the crop doctor.", 401);
  }

  try {
    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse("validation_error", "Invalid query parameters.", 422);
    }
    const { cursor, limit } = parsed.data;
    const hasCursor = typeof cursor === "string" && cursor.length > 0;

    const rows = await query<{
      id: string;
      disease_name: string;
      confidence: number;
      severity: Severity;
      crop: string;
      causes: string;
      treatment_steps: string[];
      rescan_timing: string;
      caution: string;
      image_url: string;
      created_at: string;
      farm_id: string | null;
      farm_name: string | null;
    }>(
      hasCursor
        ? `SELECT
             ds.id, ds.disease_name, ds.confidence, ds.severity, ds.crop,
             ds.causes, ds.treatment_steps, ds.rescan_timing, ds.caution,
             ds.image_url, ds.created_at, ds.farm_id,
             f.name AS farm_name
           FROM detect_scans ds
           LEFT JOIN farms f ON f.id = ds.farm_id
           WHERE ds.account_id = $1 AND ds.created_at < $2
           ORDER BY ds.created_at DESC
           LIMIT $3`
        : `SELECT
             ds.id, ds.disease_name, ds.confidence, ds.severity, ds.crop,
             ds.causes, ds.treatment_steps, ds.rescan_timing, ds.caution,
             ds.image_url, ds.created_at, ds.farm_id,
             f.name AS farm_name
           FROM detect_scans ds
           LEFT JOIN farms f ON f.id = ds.farm_id
           WHERE ds.account_id = $1
           ORDER BY ds.created_at DESC
           LIMIT $2`,
      hasCursor
        ? [session.accountId, cursor, limit]
        : [session.accountId, limit],
    );

    const scans = rows.map((r) => ({
      id: r.id,
      diseaseName: r.disease_name,
      confidence: Number(r.confidence),
      severity: r.severity,
      crop: r.crop,
      causes: r.causes,
      steps: Array.isArray(r.treatment_steps)
        ? r.treatment_steps
        : (typeof r.treatment_steps === "string"
            ? JSON.parse(r.treatment_steps)
            : []),
      rescanTiming: r.rescan_timing,
      caution: r.caution,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      farmId: r.farm_id,
      farmName: r.farm_name,
      saveStatus: r.farm_id ? "saved" : "not_saved",
    }));

    const nextCursor =
      rows.length === limit ? rows[rows.length - 1].created_at : null;

    return jsonResponse({ scans, nextCursor });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
