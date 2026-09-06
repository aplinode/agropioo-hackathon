/* PATCH /api/satellite/boundaries/:id — replace boundary geometry + re-enqueue
   DELETE /api/satellite/boundaries/:id — remove boundary + cascade-delete snapshots

   Both require ownership (FR-3.4): 404 if the boundary doesn't belong to the caller. */
import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse, readJsonBody, fieldErrorsFrom } from "@/lib/http";
import { boundaryIdParamSchema, updateBoundarySchema, bboxAreaHa, isWithinPakistan, areaExceedsLimit } from "@/lib/validation/satellite";
import * as satelliteJobs from "@/lib/satellite/jobs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to edit boundaries.", 401);

  const { id } = await params;
  const paramResult = boundaryIdParamSchema.safeParse({ id });
  if (!paramResult.success) {
    return errorResponse("validation_error", "Invalid boundary id", 400);
  }

  const body = await readJsonBody(request);
  const parsed = updateBoundarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error" as const, message: "Invalid boundary data", issues: fieldErrorsFrom(parsed.error.issues) } },
      { status: 422 },
    );
  }

  const { geojson } = parsed.data;
  const areaHa = bboxAreaHa(geojson);
  if (areaHa < 0.01) {
    return errorResponse("validation_error", "The drawn area is too small.", 422);
  }
  if (areaExceedsLimit(areaHa)) {
    return errorResponse("validation_error", "The drawn area is too large — please draw around a single field.", 422);
  }
  if (!isWithinPakistan(geojson)) {
    return errorResponse("outside_pakistan", "Coordinates appear to be outside Pakistan.", 422);
  }

  // Verify ownership
  const existing = await satelliteJobs.getOwnedBoundary(paramResult.data.id, session.accountId);
  if (!existing) {
    return errorResponse("not_found", "Boundary not found.", 404);
  }

  // Replace geometry
  const updated = await satelliteJobs.replaceBoundary(
    existing.farmId,
    session.accountId,
    geojson,
    areaHa,
  );

  const job = await satelliteJobs.enqueueNdviJob(existing.farmId, updated.id, session.accountId);

  return jsonResponse({
    boundaryId: updated.id,
    jobId: job?.id ?? null,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to delete boundaries.", 401);

  const { id } = await params;

  await satelliteJobs.deleteBoundary(id, session.accountId);

  return jsonResponse({ ok: true });
}
