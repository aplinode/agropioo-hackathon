/* GET /api/satellite/snapshots/status?farmId=…
   Returns the latest job status + active job for the farm's boundary.

   Used by the client for polling while an NDVI job is processing (FR-5). */
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";
import { statusQuerySchema } from "@/lib/validation/satellite";
import * as satelliteJobs from "@/lib/satellite/jobs";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to check status.", 401);

  const url = new URL(request.url);
  const farmId = url.searchParams.get("farmId");

  const parsed = statusQuerySchema.safeParse({ farmId: farmId ?? undefined });
  if (!parsed.success) {
    return errorResponse("validation_error", "farmId query parameter is required", 400);
  }

  const boundary = await satelliteJobs.getFarmBoundary(parsed.data.farmId, session.accountId);

  if (!boundary) {
    return jsonResponse({
      status: "no_boundary" as const,
      job: null,
    });
  }

  const job = await satelliteJobs.getActiveJob(boundary.id);
  const latest = await satelliteJobs.getLatestJob(boundary.id);

  let status: string;
  if (job) {
    status = job.status === "pending" || job.status === "processing"
      ? job.status
      : "idle";
  } else {
    status = latest?.status === "completed" ? "idle" : "no_boundary";
  }

  return jsonResponse({
    status,
    job: job
      ? {
          id: job.id,
          status: job.status,
          createdAt: job.createdAt,
          completedAt: job.completedAt ?? null,
          errorMessage: job.errorMessage ?? null,
        }
      : null,
  });
}
