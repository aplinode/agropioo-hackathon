/* POST /api/satellite/cron/refresh — nightly trigger for the NDVI processing pipeline.

   Auth: CRON_SECRET bearer token (NEON_CRON_SECRET env var).
   Iterates all farms with boundaries, re-enqueues NDVI jobs for each. */
import { jsonResponse } from "@/lib/http";
import * as satelliteJobs from "@/lib/satellite/jobs";
import { getFarmBoundary } from "@/lib/satellite/jobs";
import { processNdviJob } from "@/lib/satellite/process";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonResponse(
      { error: { code: "internal_error", message: "CRON_SECRET not configured." } },
      500,
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return jsonResponse(
      { error: { code: "unauthorized", message: "Invalid cron secret." } },
      401,
    );
  }

  const farms = await satelliteJobs.getFarmsWithBoundaries();
  if (!farms || farms.length === 0) {
    return jsonResponse({ ok: true, processed: 0, skipped: 0 });
  }

  let enqueued = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of farms) {
    try {
      const existing = await satelliteJobs.enqueueNdviJob(
        row.farmId,
        row.boundaryId,
        row.accountId,
      );
      if (!existing) {
        skipped++;
        continue;
      }

      const boundary = await getFarmBoundary(row.farmId, row.accountId);
      if (!boundary) {
        skipped++;
        continue;
      }

      void processNdviJob(existing.id, boundary).catch((err) => {
        console.error(
          `[satellite] cron refresh: processNdviJob failed for boundary ${row.boundaryId}:`,
          err,
        );
      });

      enqueued++;
    } catch (err) {
      errors.push(
        `farm ${row.farmId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return jsonResponse({
    ok: true,
    enqueued,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
