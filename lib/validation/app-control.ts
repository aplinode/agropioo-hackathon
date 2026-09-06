import { z } from "zod";

export const appControlChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z
    .string({ message: "Enter a message." })
    .trim()
    .min(1, "Enter a message.")
    .max(2000, "Message too long — keep it under 2000 characters."),
});

export const attachmentSchema = z.object({
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().max(10 * 1024 * 1024),
  url: z.string().url(),
});

export const renameConversationSchema = z.object({
  title: z
    .string({ message: "Enter a title." })
    .trim()
    .min(1, "Enter a title.")
    .max(100, "Title too long."),
});
