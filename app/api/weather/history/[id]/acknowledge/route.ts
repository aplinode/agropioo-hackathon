import { query } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { acknowledgeSchema } from "@/lib/validation/weather";

/* POST /api/weather/history/[id]/acknowledge — mark an advisory as acknowledged
   or acted upon (FR-011). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const body = await request.json().catch(() => undefined);
    const parsed = acknowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
        { status: 422 },
      );
    }

    const { id } = await params;
    const acted = parsed.data.action === "acted_upon";
    const result = await query<{ id: string }>(
      `UPDATE weather_advisories
       SET acknowledged = true, acted_upon = $3
       WHERE id = $1 AND account_id = $2
       RETURNING id`,
      [id, session.accountId, acted],
    );
    if (!result || result.length === 0) {
      return errorResponse("not_found", "Advisory not found", 404);
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
