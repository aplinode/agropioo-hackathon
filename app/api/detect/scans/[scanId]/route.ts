import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to delete scans.", 401);

  const { scanId } = await params;

  const scanRow = await queryOne<{ id: string }>(
    `SELECT id FROM detect_scans WHERE id = $1 AND account_id = $2`,
    [scanId, session.accountId],
  );

  if (!scanRow) {
    return errorResponse("not_found", "Scan not found.", 404);
  }

  await query(`DELETE FROM detect_scans WHERE id = $1`, [scanId]);

  return jsonResponse({ deleted: true });
}
