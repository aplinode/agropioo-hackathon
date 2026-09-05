import { z } from "zod";

export const forecastQuerySchema = z.object({
  farm_id: z.string().uuid("Invalid farm"),
});

export const alertsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const alertIdSchema = z.object({
  id: z.string().uuid("Invalid alert id"),
});

export const growthStageSchema = z.object({
  farm_id: z.string().uuid("Invalid farm"),
  crop: z.string().min(1, "Crop is required"),
  stage: z.string().min(1, "Stage is required"),
});

export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type AlertsQuery = z.infer<typeof alertsQuerySchema>;
export type AlertIdInput = z.infer<typeof alertIdSchema>;
export type GrowthStageInput = z.infer<typeof growthStageSchema>;
