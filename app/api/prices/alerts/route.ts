/**
 * /api/prices/alerts — farmer price alert CRUD.
 * GET list, POST create, PUT update, DELETE remove.
 */

import { query, queryOne } from "@/lib/db";
import { errorResponse, jsonResponse, readJsonBody } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { alertCreateSchema, alertUpdateSchema } from "@/lib/prices/api-types";

export async function GET(): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const alerts = await query<{
      id: string;
      crop_id: string;
      crop_name_en: string;
      mandi_id: string | null;
      mandi_name_en: string | null;
      target_price_pkr: number;
      status: string;
      last_triggered_at: string | null;
    }>(
      `select a.id, a.crop_id, c.name_en as crop_name_en,
              a.mandi_id, m.name_en as mandi_name_en,
              a.target_price_pkr, a.status, a.last_triggered_at
       from price_alerts a
       join crops c on c.id = a.crop_id
       left join mandis m on m.id = a.mandi_id
       where a.user_id = $1
       order by a.created_at desc`,
      [session.accountId]
    );
    return jsonResponse({ alerts: alerts ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/prices/alerts error:", message);
    return errorResponse("server_error", message, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const body = await readJsonBody(request);
  const parsed = alertCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid alert data", 422);
  }

  const input = parsed.data;

  try {
    const crop = await queryOne<{ id: string }>(`select id from crops where id = $1`, [input.crop_id]);
    if (!crop) return errorResponse("not_found", "Crop not found", 404);

    if (input.mandi_id) {
      const mandi = await queryOne<{ id: string }>(`select id from mandis where id = $1`, [input.mandi_id]);
      if (!mandi) return errorResponse("not_found", "Mandi not found", 404);
    }

    const alert = await queryOne<{
      id: string;
      crop_id: string;
      crop_name_en: string;
      mandi_id: string | null;
      mandi_name_en: string | null;
      target_price_pkr: number;
      status: string;
    }>(
      `insert into price_alerts (user_id, crop_id, mandi_id, target_price_pkr, status)
       values ($1, $2, $3, $4, $5)
       returning id, crop_id, (select name_en from crops where id = $2) as crop_name_en,
                 mandi_id, (select name_en from mandis where id = $3) as mandi_name_en,
                 target_price_pkr, status`,
      [session.accountId, input.crop_id, input.mandi_id ?? null, input.target_price_pkr, input.status]
    );

    return jsonResponse({ alert }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/prices/alerts error:", message);
    return errorResponse("server_error", message, 500);
  }
}

export async function PUT(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const alertId = searchParams.get("id");
  if (!alertId) return errorResponse("validation_error", "Alert id is required", 422);

  const body = await readJsonBody(request);
  const parsed = alertUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid alert data", 422);
  }

  const input = parsed.data;
  if (Object.keys(input).length === 0) {
    return errorResponse("validation_error", "No fields to update", 422);
  }

  try {
    const existing = await queryOne<{ user_id: string }>(
      `select user_id from price_alerts where id = $1`,
      [alertId]
    );
    if (!existing) return errorResponse("not_found", "Alert not found", 404);
    if (existing.user_id !== session.accountId) return errorResponse("unauthorized", "Forbidden", 403);

    const alert = await queryOne<{
      id: string;
      crop_id: string;
      crop_name_en: string;
      mandi_id: string | null;
      mandi_name_en: string | null;
      target_price_pkr: number;
      status: string;
    }>(
      `update price_alerts
       set target_price_pkr = coalesce($2, target_price_pkr),
           status = coalesce($3, status),
           updated_at = now()
       where id = $1
       returning id, crop_id, (select name_en from crops where id = price_alerts.crop_id) as crop_name_en,
                 mandi_id, (select name_en from mandis where id = price_alerts.mandi_id) as mandi_name_en,
                 target_price_pkr, status`,
      [alertId, input.target_price_pkr ?? null, input.status ?? null]
    );

    return jsonResponse({ alert });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PUT /api/prices/alerts error:", message);
    return errorResponse("server_error", message, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const alertId = searchParams.get("id");
  if (!alertId) return errorResponse("validation_error", "Alert id is required", 422);

  try {
    const existing = await queryOne<{ user_id: string }>(
      `select user_id from price_alerts where id = $1`,
      [alertId]
    );
    if (!existing) return errorResponse("not_found", "Alert not found", 404);
    if (existing.user_id !== session.accountId) return errorResponse("unauthorized", "Forbidden", 403);

    await query(`delete from price_alerts where id = $1`, [alertId]);
    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("DELETE /api/prices/alerts error:", message);
    return errorResponse("server_error", message, 500);
  }
}
