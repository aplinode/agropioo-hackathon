import { queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to view chat details.", 401);

  const { chatId } = await params;

  const chatRow = await queryOne<{
    id: string;
    title: string;
    scan_id: string | null;
    updated_at: string;
  }>(
    `SELECT id, title, scan_id, updated_at FROM detect_chats WHERE id = $1 AND account_id = $2`,
    [chatId, session.accountId],
  );

  if (!chatRow) {
    return errorResponse("not_found", "Chat not found.", 404);
  }

  let scan: {
    id: string;
    disease_name: string;
    confidence: number;
    severity: string;
    crop: string;
    causes: string;
    treatment_steps: string;
    rescan_timing: string;
    caution: string;
    image_url: string;
  } | null = null;

  if (chatRow.scan_id) {
    scan = await queryOne(
      `SELECT id, disease_name, confidence, severity, crop, causes, treatment_steps, rescan_timing, caution, image_url
       FROM detect_scans WHERE id = $1`,
      [chatRow.scan_id],
    );
  }

  return jsonResponse({
    chat: {
      id: chatRow.id,
      title: chatRow.title,
      scanId: chatRow.scan_id,
      updatedAt: chatRow.updated_at,
    },
    scan: scan
      ? {
          id: scan.id,
          diseaseName: scan.disease_name,
          confidence: Number(scan.confidence),
          severity: scan.severity,
          crop: scan.crop,
          causes: scan.causes,
          steps: Array.isArray(scan.treatment_steps)
            ? scan.treatment_steps
            : JSON.parse(scan.treatment_steps || "[]"),
          rescanTiming: scan.rescan_timing,
          caution: scan.caution,
          imageUrl: scan.image_url,
        }
      : null,
  });
}
