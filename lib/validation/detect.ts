import { z } from "zod";

/** When a scan is linked to a farm after the fact (FR-5.1, FR-7.3). */
export const detectSaveSchema = z.object({
  scanId: z.string().uuid(),
  farmId: z.string().uuid(),
});

export type DetectSaveInput = z.infer<typeof detectSaveSchema>;
