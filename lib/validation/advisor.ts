import { z } from "zod";

export const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z
    .string({ message: "Enter a message." })
    .trim()
    .min(1, "Enter a message.")
    .max(2000, "Message too long — keep it under 2000 characters."),
});

export const createConversationSchema = z.object({
  language: z.string().min(2).max(5).default("en"),
});

export const renameConversationSchema = z.object({
  title: z
    .string({ message: "Enter a title." })
    .trim()
    .min(1, "Enter a title.")
    .max(100, "Title too long."),
});
