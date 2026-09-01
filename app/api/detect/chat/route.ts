import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, clientIp } from "@/lib/http";
import { hitLimiter, HOUR_MS } from "@/lib/auth/rate-limit";
import { createDetectAgent } from "@/lib/detect/chat-agent";
import { run } from "@openai/agents";
import { toSSEStream } from "@/lib/advisor/streaming";

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to use detect chat.", 401);

  if (!hitLimiter("detect-chat", clientIp(request), 30, HOUR_MS)) {
    return errorResponse("rate_limited", "Too many messages. Try again in a moment.", 429);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.chatId) {
    return errorResponse("validation_error", "chatId and message are required.", 422);
  }

  const { chatId, message } = body;

  const chatRow = await queryOne<{
    id: string;
    scan_id: string | null;
    title: string;
  }>(
    `SELECT id, scan_id, title FROM detect_chats WHERE id = $1 AND account_id = $2`,
    [chatId, session.accountId],
  );

  if (!chatRow) {
    return errorResponse("not_found", "Chat not found.", 404);
  }

  let scanRow: {
    disease_name: string;
    crop: string;
    severity: string;
    confidence: number;
    causes: string;
    treatment_steps: string;
    rescan_timing: string;
    caution: string;
  } | null = null;

  if (chatRow.scan_id) {
    scanRow = await queryOne(
      `SELECT disease_name, crop, severity, confidence, causes, treatment_steps, rescan_timing, caution
       FROM detect_scans WHERE id = $1`,
      [chatRow.scan_id],
    );
  }

  const diseaseName = scanRow?.disease_name ?? "Unknown";
  const crop = scanRow?.crop ?? "Unknown crop";
  const severity = scanRow?.severity ?? "watch";
  const confidence = Number(scanRow?.confidence ?? 0);
  const causes = scanRow?.causes ?? "";
  const steps = scanRow?.treatment_steps
    ? Array.isArray(scanRow.treatment_steps)
      ? scanRow.treatment_steps
      : JSON.parse(scanRow.treatment_steps || "[]")
    : [];
  const rescanTiming = scanRow?.rescan_timing ?? "";
  const caution = scanRow?.caution ?? "";

  const agent = createDetectAgent({
    diseaseName,
    crop,
    severity,
    confidence,
    causes,
    steps,
    rescanTiming,
    caution,
    locale: "en",
  });

  const farmerMessage = message.trim();
  if (!farmerMessage) {
    return errorResponse("validation_error", "Message cannot be empty.", 422);
  }

  await query(
    `INSERT INTO detect_messages (chat_id, role, content) VALUES ($1, 'farmer', $2)`,
    [chatId, farmerMessage],
  );

  await query(
    `UPDATE detect_chats SET updated_at = now() WHERE id = $1`,
    [chatId],
  );

  let result;
  try {
    result = await run(agent, farmerMessage, { stream: true });
  } catch {
    return errorResponse(
      "server_error",
      "Detection chat is temporarily unavailable. Please try again.",
      503,
    );
  }

  const sseStream = toSSEStream(result, chatId, async (advisorOutput) => {
    await query(
      `INSERT INTO detect_messages (chat_id, role, content) VALUES ($1, 'detect', $2)`,
      [chatId, advisorOutput],
    );
    await query(
      `UPDATE detect_chats SET updated_at = now() WHERE id = $1`,
      [chatId],
    );
    const title = farmerMessage.length > 80 ? `${farmerMessage.slice(0, 80)}…` : farmerMessage;
    await query(
      `UPDATE detect_chats SET title = $1 WHERE id = $2 AND title = 'New detection chat'`,
      [title, chatId],
    );
  }, farmerMessage);

  return new Response(sseStream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
