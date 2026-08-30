import { z } from "zod";
import { CROPS } from "@/lib/farms/constants";

const cropEnum = z.enum(CROPS);

export const registerWeatherSchema = z.object({
  farm_id: z.string().uuid("Invalid farm"),
  primary_crop: cropEnum,
  sowing_date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(v) < today;
    }, "Sowing date must be in the past"),
  soil_type: z.string().min(1, "Soil type is required").max(40),
  irrigation_method: z.string().min(1, "Irrigation method is required").max(40),
});

export const forecastQuerySchema = z.object({
  farm_id: z.string().uuid("Invalid farm"),
});

export const alertsQuerySchema = z.object({});

export const historyQuerySchema = z.object({
  farm_id: z.string().uuid("Invalid farm"),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const acknowledgeSchema = z.object({
  action: z.enum(["acknowledged", "acted_upon"]),
});

export const alertIdSchema = z.object({
  id: z.string().uuid("Invalid alert id"),
});

export type RegisterWeatherInput = z.infer<typeof registerWeatherSchema>;
export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type AcknowledgeInput = z.infer<typeof acknowledgeSchema>;
