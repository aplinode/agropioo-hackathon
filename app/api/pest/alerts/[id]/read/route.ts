import { errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { alertIdSchema } from "@/lib/validation/pest";
import { query } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  try {
    const { id } = await params;
    const parsed = alertIdSchema.safeParse({ id });
    if (!parsed.success) {
      return Response.json(
        { error: { code: "validation_error", message: "Invalid input", issues: parsed.error.issues } },
        { status: 422 },
      );
    }

    const result = await query<{ id: string }>(
      `UPDATE pest_alerts SET read_at = now() WHERE id = $1 AND account_id = $2 AND read_at IS NULL RETURNING id`,
      [id, session.accountId],
    );
    if (!result || result.length === 0) {
      return errorResponse("not_found", "Alert not found", 404);
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse("server_error", message, 500);
  }
}
