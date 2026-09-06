/* POST /api/satellite/boundaries  — save a farm boundary + enqueue NDVI job
   GET /api/satellite/boundaries?farmId=… — load the saved boundary for a farm

   Guards:
   - FR-3.4: auth required (401)
   - FR-5.1: Zod validation → 422 on invalid input
   - FR-5.2: polygon must close, ≥ 4 points (validation_error)
   - FR-5.3: area must be <= 500 ha (validation_error)
   - FR-5.4: must fall within Pakistan bbox (outside_pakistan) */
import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody, fieldErrorsFrom, clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/http";
import { saveBoundarySchema, bboxAreaHa, isWithinPakistan, areaExceedsLimit } from "@/lib/validation/satellite";
import * as satelliteJobs from "@/lib/satellite/jobs";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view boundaries.", 401);

  const url = new URL(request.url);
  const farmId = url.searchParams.get("farmId");
  if (!farmId) {
    return errorResponse("validation_error", "farmId query parameter is required", 400);
  }

  const boundary = await satelliteJobs.getFarmBoundary(farmId, session.accountId);
  if (!boundary) {
    return errorResponse("not_found", "No boundary found for this farm", 404);
  }

  return jsonResponse({
    boundary: {
      id: boundary.id,
      geojson: boundary.geojson,
      areaHa: boundary.areaHa,
      updatedAt: boundary.updatedAt.toISOString(),
    },
  });
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to save a boundary.", 401);

  // Basic per-IP rate limiting for boundary submissions (FR-5.3)
  const rl = rateLimit(`satellite:boundary:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) {
    return errorResponse("rate_limited", "Too many requests. Slow down.", 429);
  }

  const body = await readJsonBody(request);
  const parsed = saveBoundarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error" as const, message: "Invalid boundary data", issues: fieldErrorsFrom(parsed.error.issues) } },
      { status: 422 },
    );
  }

  const { farmId, geojson } = parsed.data;

  // FR-5.3: area guard
  const areaHa = bboxAreaHa(geojson);
  if (areaHa < 0.01) {
    return errorResponse("validation_error", "The drawn area is too small.", 422);
  }
  if (areaExceedsLimit(areaHa)) {
    return errorResponse("validation_error", "The drawn area is too large — please draw around a single field.", 422);
  }

  // FR-5.4: Pakistan bounds guard
  if (!isWithinPakistan(geojson)) {
    return errorResponse("outside_pakistan", "Coordinates appear to be outside Pakistan. Please check your field location.", 422);
  }

  // Verify the farm belongs to this account
  const farm = await satelliteJobs.getOwnedFarm(farmId, session.accountId);
  if (!farm) {
    return errorResponse("not_found", "Farm not found.", 404);
  }

  // Save boundary (replaces any existing one for this farm)
  const saved = await satelliteJobs.replaceBoundary(
    farmId,
    session.accountId,
    geojson,
    areaHa,
  );

  // Enqueue an NDVI processing job
  const job = await satelliteJobs.enqueueNdviJob(farmId, saved.id, session.accountId);

  return jsonResponse({
    boundaryId: saved.id,
    jobId: job?.id ?? null,
  }, 201);
}
