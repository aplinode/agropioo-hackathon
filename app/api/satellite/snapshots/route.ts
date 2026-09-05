/* GET /api/satellite/snapshots?boundaryId=…&weeks=12
   Returns the 12-week history of NDVI snapshots for a boundary.

   Auth: FR-3.4 (401). Ownership: the boundaryId is resolved through the
   snapshot's account_id, so cross-account access yields 404. */
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";
import { snapshotsQuerySchema } from "@/lib/validation/satellite";
import * as satelliteJobs from "@/lib/satellite/jobs";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view field health.", 401);

  const url = new URL(request.url);
  const boundaryId = url.searchParams.get("boundaryId");
  const weeks = url.searchParams.get("weeks");

  const parsed = snapshotsQuerySchema.safeParse({
    boundaryId: boundaryId ?? undefined,
    weeks: weeks ? Number(weeks) : undefined,
  });
  if (!parsed.success) {
    return errorResponse("validation_error", "Invalid query parameters", 400);
  }

  const snapshots = await satelliteJobs.getSnapshots(
    parsed.data.boundaryId,
    session.accountId,
    parsed.data.weeks,
  );

  return jsonResponse({
    snapshots: snapshots.map((s) => ({
      id: s.id,
      snapshotDate: s.snapshotDate,
      meanNdvi: s.meanNdvi,
      cloudCover: s.cloudCover,
      imageUrl: s.imageUrl,
      areaHa: s.areaHa ?? null,
    })),
  });
}
