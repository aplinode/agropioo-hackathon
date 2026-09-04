/**
 * GET /api/favourites — list the farmer's favourite crops.
 * POST /api/favourites — add or reorder a favourite crop.
 * DELETE /api/favourites — remove a favourite crop.
 */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { favouriteCropSchema } from "@/lib/prices/api-types";

export async function GET(): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const favourites = await query<{ crop_id: string; display_order: number }>(
      `select crop_id, display_order from user_crop_preferences where user_id = $1 order by display_order asc`,
      [session.accountId]
    );
    return jsonResponse({ favourites: favourites ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/favourites error:", message);
    return errorResponse("server_error", message, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const body = await readJsonBody(request);
  const parsed = favouriteCropSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid favourite data", 422);
  }

  const input = parsed.data;

  try {
    const crop = await queryOne<{ id: string }>(`select id from crops where id = $1`, [input.crop_id]);
    if (!crop) return errorResponse("not_found", "Crop not found", 404);

    const displayOrder = input.display_order ?? 0;

    await query(
      `insert into user_crop_preferences (user_id, crop_id, display_order)
       values ($1, $2, $3)
       on conflict (user_id, crop_id) do update set display_order = excluded.display_order`,
      [session.accountId, input.crop_id, displayOrder]
    );

    const favourites = await query<{ crop_id: string; display_order: number }>(
      `select crop_id, display_order from user_crop_preferences where user_id = $1 order by display_order asc`,
      [session.accountId]
    );

    return jsonResponse({ favourites: favourites ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/favourites error:", message);
    return errorResponse("server_error", message, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const cropId = searchParams.get("crop_id");
  if (!cropId) return errorResponse("validation_error", "crop_id is required", 422);

  try {
    await query(
      `delete from user_crop_preferences where user_id = $1 and crop_id = $2`,
      [session.accountId, cropId]
    );

    const favourites = await query<{ crop_id: string; display_order: number }>(
      `select crop_id, display_order from user_crop_preferences where user_id = $1 order by display_order asc`,
      [session.accountId]
    );

    return jsonResponse({ favourites: favourites ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("DELETE /api/favourites error:", message);
    return errorResponse("server_error", message, 500);
  }
}
