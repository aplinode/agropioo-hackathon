import { queryOne } from "@/lib/db";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { registerWeatherSchema } from "@/lib/validation/weather";

/* POST /api/weather/register — set a farm's weather-advisory profile
   (primary crop, sowing date, soil, irrigation). The farm itself must already
   exist and belong to the authenticated account (FR-001). */
export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const body = await readJsonBody(request);
    const parsed = registerWeatherSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues } },
        { status: 422 },
      );
    }

    const farm = await queryOne<{ id: string }>(
      `SELECT id FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
      [parsed.data.farm_id, session.accountId],
    );
    if (!farm) return errorResponse("not_found", "Farm not found", 404);

    const updated = await queryOne(
      `UPDATE farms
       SET primary_crop = $1, sowing_date = $2, soil_type = $3, irrigation_method = $4,
           updated_at = now()
       WHERE id = $5 AND account_id = $6
       RETURNING id, primary_crop, sowing_date, soil_type, irrigation_method`,
      [
        parsed.data.primary_crop,
        parsed.data.sowing_date,
        parsed.data.soil_type,
        parsed.data.irrigation_method,
        parsed.data.farm_id,
        session.accountId,
      ],
    );
    if (!updated) return errorResponse("server_error", "Failed to update farm", 500);
    return jsonResponse(updated, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
