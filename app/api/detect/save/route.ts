/**
 * POST /api/detect/save — link an existing scan to a farm and record it as a
 * disease entry in the farm's record log (spec FR-5.1; plan T11).
 */

import { queryOne, withTransaction } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { detectSaveSchema } from "@/lib/validation/detect";
import type { Season } from "@/lib/farms/constants";

/** Map a 0-indexed month to the records-table season enum. */
function seasonForMonth(month: number): Season {
  if (month <= 2) return "Winter";
  if (month <= 5) return "Summer";
  if (month <= 8) return "Rainy";
  return "Dry";
}

/** Build the fiscal-style season year tag, e.g. "2026-27". */
function seasonYear(now: Date): string {
  const y = now.getFullYear();
  return `${y}-${String(y + 1).slice(-2)}`;
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) {
    return errorResponse("unauthorized", "Sign in to use the crop doctor.", 401);
  }

  try {
    const body = await readJsonBody(request);
    const parsed = detectSaveSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "validation_error",
        parsed.error.issues[0]?.message ?? "Invalid input.",
        422,
      );
    }
    const { scanId, farmId } = parsed.data;

    // Ownership checks (FR-6.6 / auth): the scan and farm must belong to the account.
    const scan = await queryOne<{
      id: string;
      disease_name: string;
      confidence: number;
      severity: string;
      crop: string;
      causes: string;
      treatment_steps: unknown;
      rescan_timing: string;
      caution: string;
    }>(
      `SELECT id, disease_name, confidence, severity, crop, causes,
              treatment_steps, rescan_timing, caution
       FROM detect_scans
       WHERE id = $1 AND account_id = $2`,
      [scanId, session.accountId],
    );
    if (!scan) {
      return errorResponse("not_found", "Scan not found.", 404);
    }

    const farm = await queryOne<{ id: string }>(
      `SELECT id FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [farmId, session.accountId],
    );
    if (!farm) {
      return errorResponse("not_found", "Farm not found.", 404);
    }

    const now = new Date();
    const month = now.getMonth();
    const stepsValue =
      typeof scan.treatment_steps === "string"
        ? JSON.parse(scan.treatment_steps)
        : scan.treatment_steps;

    const record = await withTransaction(async (client) => {
      const insertResult = await client.query<{ id: string }>(
        `INSERT INTO records
           (account_id, farm_id, type, season, year, event_date, title, note)
         VALUES ($1, $2, 'disease', $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          session.accountId,
          farmId,
          seasonForMonth(month),
          seasonYear(now),
          now.toISOString().slice(0, 10),
          scan.disease_name,
          JSON.stringify({
            scanId: scan.id,
            diseaseName: scan.disease_name,
            confidence: Number(scan.confidence),
            severity: scan.severity,
            crop: scan.crop,
            causes: scan.causes,
            treatmentSteps: stepsValue,
            rescanTiming: scan.rescan_timing,
            caution: scan.caution,
          }),
        ],
      );

      await client.query(
        `UPDATE detect_scans SET farm_id = $1 WHERE id = $2`,
        [farmId, scanId],
      );

      return insertResult.rows[0];
    });

    return jsonResponse({ saved: true, recordId: record.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
