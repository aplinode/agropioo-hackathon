/**
 * Database helpers for the satellite monitoring feature.
 *
 * All queries flow through the one shared `lib/db` module.
 * Ownership is enforced at the SQL level (account_id filters) so the
 * server is the source of truth — the client is never trusted (FR-10).
 */
import { query, queryOne, withTransaction } from "@/lib/db";
import type { FieldBoundary, NdviSnapshot, NdviJob } from "./types";

export interface FarmRow {
  farmId: string;
  accountId: string;
  boundaryId: string;
}

/* ── Farm lookups ──────────────────────────────────────────────── */

export async function getOwnedFarm(
  farmId: string,
  accountId: string,
): Promise<{ id: string; name: string; lat: number; lng: number } | null> {
  return queryOne<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>(
    `SELECT id, name, lat, lng FROM farms
     WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
    [farmId, accountId],
  );
}

/* ── Boundary CRUD ─────────────────────────────────────────────── */

export async function getFarmBoundary(
  farmId: string,
  accountId: string,
): Promise<FieldBoundary | null> {
  return queryOne<FieldBoundary>(
    `SELECT id, farm_id AS "farmId", account_id AS "accountId",
            geojson, area_ha AS "areaHa", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM field_boundaries
     WHERE farm_id = $1 AND account_id = $2`,
    [farmId, accountId],
  );
}

export async function getOwnedBoundary(
  boundaryId: string,
  accountId: string,
): Promise<FieldBoundary | null> {
  return queryOne<FieldBoundary>(
    `SELECT id, farm_id AS "farmId", account_id AS "accountId",
            geojson, area_ha AS "areaHa", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM field_boundaries
     WHERE id = $1 AND account_id = $2`,
    [boundaryId, accountId],
  );
}

export async function replaceBoundary(
  farmId: string,
  accountId: string,
  geojson: { type: string; coordinates: number[][][] },
  areaHa: number,
): Promise<FieldBoundary> {
  return withTransaction(async (client) => {
    await client.query(
      `DELETE FROM field_boundaries
       WHERE farm_id = $1 AND account_id = $2`,
      [farmId, accountId],
    );

    const row = await client.query<
      {
        id: string;
        farm_id: string;
        account_id: string;
        geojson: { type: string; coordinates: number[][][] };
        area_ha: number;
        created_at: Date;
        updated_at: Date;
      }
    >(
      `INSERT INTO field_boundaries
         (farm_id, account_id, geojson, area_ha, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [farmId, accountId, geojson, areaHa],
    );

    const r = row.rows[0];
    return {
      id: r.id,
      farmId: r.farm_id,
      accountId: r.account_id,
      geojson: r.geojson as unknown as FieldBoundary["geojson"],
      areaHa: Number(r.area_ha),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

export async function deleteBoundary(
  boundaryId: string,
  accountId: string,
): Promise<void> {
  await query(
    `DELETE FROM field_boundaries
     WHERE id = $1 AND account_id = $2`,
    [boundaryId, accountId],
  );
}

/* ── Snapshot queries ────────────────────────────────────────────── */

export async function getSnapshots(
  boundaryId: string,
  accountId: string,
  weeks: number,
): Promise<NdviSnapshot[]> {
  return query<NdviSnapshot>(
    `SELECT id, boundary_id AS "boundaryId", account_id AS "accountId",
            snapshot_date AS "snapshotDate", mean_ndvi AS "meanNdvi",
            cloud_cover AS "cloudCover", image_url AS "imageUrl", area_ha AS "areaHa",
            created_at AS "createdAt"
     FROM ndvi_snapshots
     WHERE boundary_id = $1 AND account_id = $2
       AND snapshot_date >= CURRENT_DATE - INTERVAL '1 week' * $3
     ORDER BY snapshot_date DESC`,
    [boundaryId, accountId, weeks],
  );
}

export async function insertSnapshot(
  boundaryId: string,
  accountId: string,
  snapshotDate: string,
  meanNdvi: number,
  cloudCover: boolean,
  imageUrl: string,
  areaHa?: number,
): Promise<NdviSnapshot | null> {
  return queryOne<NdviSnapshot>(
    `INSERT INTO ndvi_snapshots
       (boundary_id, account_id, snapshot_date, mean_ndvi, cloud_cover, image_url, area_ha, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (boundary_id, snapshot_date) DO NOTHING
     RETURNING id, boundary_id AS "boundaryId", account_id AS "accountId",
               snapshot_date AS "snapshotDate", mean_ndvi AS "meanNdvi",
               cloud_cover AS "cloudCover", image_url AS "imageUrl", area_ha AS "areaHa",
               created_at AS "createdAt"`,
    [boundaryId, accountId, snapshotDate, meanNdvi, cloudCover, imageUrl, areaHa ?? null],
  );
}

/* ── Job queries ─────────────────────────────────────────────────── */

export async function enqueueNdviJob(
  farmId: string,
  boundaryId: string,
  accountId: string,
): Promise<NdviJob | null> {
  const existing = await queryOne<NdviJob>(
    `SELECT id, boundary_id AS "boundaryId", account_id AS "accountId",
            status, error_message AS "errorMessage", created_at AS "createdAt",
            completed_at AS "completedAt"
     FROM ndvi_jobs
     WHERE boundary_id = $1 AND status IN ('pending', 'processing')
     ORDER BY created_at DESC
     LIMIT 1`,
    [boundaryId],
  );
  if (existing) return existing;

  return queryOne<NdviJob>(
    `INSERT INTO ndvi_jobs (boundary_id, account_id, status, created_at)
     VALUES ($1, $2, 'pending', NOW())
     RETURNING id, boundary_id AS "boundaryId", account_id AS "accountId",
               status, error_message AS "errorMessage", created_at AS "createdAt",
               completed_at AS "completedAt"`,
    [boundaryId, accountId],
  );
}

export async function updateJobStatus(
  jobId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string,
): Promise<void> {
  const completedAt = status === "completed" || status === "failed" ? "NOW()" : "NULL";
  await query(
    `UPDATE ndvi_jobs
     SET status = $1, error_message = $2, completed_at = ${completedAt}
     WHERE id = $3`,
    [status, errorMessage ?? null, jobId],
  );
}

export async function getActiveJob(
  boundaryId: string,
): Promise<NdviJob | null> {
  return queryOne<NdviJob>(
    `SELECT id, boundary_id AS "boundaryId", account_id AS "accountId",
            status, error_message AS "errorMessage", created_at AS "createdAt",
            completed_at AS "completedAt"
     FROM ndvi_jobs
     WHERE boundary_id = $1 AND status IN ('pending', 'processing')
     ORDER BY created_at DESC
     LIMIT 1`,
    [boundaryId],
  );
}

export async function getLatestJob(
  boundaryId: string,
): Promise<NdviJob | null> {
  return queryOne<NdviJob>(
    `SELECT id, boundary_id AS "boundaryId", account_id AS "accountId",
            status, error_message AS "errorMessage", created_at AS "createdAt",
            completed_at AS "completedAt"
     FROM ndvi_jobs
     WHERE boundary_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [boundaryId],
  );
}

/* ── Cron helper ────────────────────────────────────────────────── */

export async function getFarmsWithBoundaries(): Promise<FarmRow[]> {
  return query<FarmRow>(
    `SELECT f.id AS "farmId", f.account_id AS "accountId", b.id AS "boundaryId"
     FROM farms f
     JOIN field_boundaries b ON b.farm_id = f.id
     WHERE f.archived_at IS NULL`,
  );
}
