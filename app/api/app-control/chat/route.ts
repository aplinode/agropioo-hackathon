import { query, queryOne } from "@/lib/db";
import { requireSessionApi } from "@/lib/auth/guards";
import { errorResponse, readJsonBody, clientIp } from "@/lib/http";
import { hitLimiter, HOUR_MS } from "@/lib/auth/rate-limit";
import { appControlChatSchema, attachmentSchema } from "@/lib/validation/app-control";
import { createAppControlAgent, type AppControlContext } from "@/lib/app-control/agent";
import { toAppControlSSEStream, sseHeaders } from "@/lib/app-control/streaming";
import { run } from "@openai/agents";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_INPUT_TOKENS_ESTIMATE = 2000;

async function uploadAttachment(buffer: Buffer, accountId: string, filename: string): Promise<string> {
  const safeName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const publicId = `app_control/${safeName ? safeName + "_" : ""}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `app_control/user_${accountId}`,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
      },
      (err, result) => {
        if (err) {
          reject(new Error(`Upload failed: ${err.message}`));
          return;
        }
        const res = result as { secure_url?: string };
        if (!res.secure_url) {
          reject(new Error("Upload returned no URL"));
          return;
        }
        resolve(res.secure_url);
      },
    );
    stream.end(buffer);
  });
}

function estimateTokens(text: string): number {
  const urduChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const otherChars = text.length - urduChars;
  return Math.ceil(urduChars / 2 + otherChars / 4);
}

function parsePageContext(request: Request): { currentPath: string; pageState: Record<string, unknown> } {
  const header = request.headers.get("X-Page-Context");
  if (header) {
    try {
      const parsed = JSON.parse(header);
      return {
        currentPath: typeof parsed.currentPath === "string" ? parsed.currentPath : "",
        pageState: typeof parsed.pageState === "object" && parsed.pageState !== null ? parsed.pageState : {},
      };
    } catch {
      // ignore malformed header
    }
  }
  return { currentPath: "", pageState: {} };
}

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Sign in to use app control.", 401);

  if (!hitLimiter("app-control-chat", clientIp(request), 30, HOUR_MS)) {
    return errorResponse("rate_limited", "Too many requests. Try again in a moment.", 429);
  }
  if (!hitLimiter("app-control-chat-account", session.accountId, 50, HOUR_MS)) {
    return errorResponse("rate_limited", "You've used app control a lot today. Try again later.", 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let message: string;
  let conversationId: string | undefined;
  const attachments: Array<{ type: string; url: string; name: string; size: number }> = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawMessage = formData.get("message");
    const rawConversationId = formData.get("conversationId");
    const rawAttachments = formData.getAll("attachments");

    if (typeof rawMessage !== "string") {
      return errorResponse("validation_error", "Message is required.", 422);
    }

    message = rawMessage.trim();
    if (rawConversationId && typeof rawConversationId === "string") {
      conversationId = rawConversationId.trim();
    }

    const parsed = appControlChatSchema.safeParse({ conversationId, message });
    if (!parsed.success) {
      return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    }

    for (const file of rawAttachments) {
      if (!(file instanceof File)) continue;
      if (file.size > 10 * 1024 * 1024) {
        return errorResponse("validation_error", `File "${file.name}" is too large (max 10 MB).`, 422);
      }
      const mime = file.type || "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        return errorResponse("validation_error", `Unsupported file type: ${mime}. Use JPEG, PNG, or WebP.`, 422);
      }
      const attachmentParsed = attachmentSchema.safeParse({ type: mime, size: file.size, url: "" });
      if (!attachmentParsed.success) {
        return errorResponse("validation_error", "Invalid attachment.", 422);
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadAttachment(buffer, session.accountId, file.name);
        attachments.push({ type: mime, url, name: file.name, size: file.size });
      } catch (err) {
        console.error("[AppControl] Upload failed:", err);
        return errorResponse("server_error", "Failed to upload image. Please try again.", 500);
      }
    }
  } else {
    const body = await readJsonBody(request);
    const parsed = appControlChatSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("validation_error", parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    }
    message = parsed.data.message;
    conversationId = parsed.data.conversationId;
  }

  const inputTokens = estimateTokens(message);
  if (inputTokens > MAX_INPUT_TOKENS_ESTIMATE) {
    return errorResponse("validation_error", "Your message is too long. Please keep it under 2000 characters.", 422);
  }

  let convId = conversationId;
  if (!convId) {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO app_control_conversations (account_id, title, language)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [session.accountId, message.slice(0, 60) || "New conversation", "en"]
    );
    convId = row?.id;
    if (!convId) {
      return errorResponse("server_error", "Could not create conversation.", 500);
    }
  }

  const pageContext = parsePageContext(request);

  const ctx: AppControlContext = {
    accountId: session.accountId,
    language: "en",
    currentPath: pageContext.currentPath,
    pageState: pageContext.pageState,
    attachments,
  };

  const agent = createAppControlAgent(ctx);

  let result;
  try {
    result = await run(agent, message, {
      stream: true,
      maxTurns: 10,
    });
  } catch (err) {
    console.error("[AppControl Chat] Agent run failed:", err);
    return errorResponse(
      "server_error",
      "App control is temporarily unavailable. Please try again in a moment.",
      503,
    );
  }

  const now = new Date();
  const sseStream = toAppControlSSEStream(result, convId, undefined, async (output) => {
    await query(
      `INSERT INTO app_control_messages (conversation_id, role, content, attachments) VALUES ($1, $2, $3, $4)`,
      [convId, "farmer", message, JSON.stringify(attachments)]
    );
    await query(
      `INSERT INTO app_control_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
      [convId, "agent", output]
    );
    await query(
      `UPDATE app_control_conversations SET updated_at = $1 WHERE id = $2`,
      [now.toISOString(), convId]
    );

    const outputTokens = estimateTokens(output);
    console.log(
      `[AppControl Chat] account=${session.accountId} input≈${inputTokens}t output≈${outputTokens}t conv=${convId}`
    );
  }, message);

  return new Response(sseStream, { headers: sseHeaders });
}
