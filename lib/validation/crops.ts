import { z } from "zod";

export const seasonEnum = z.enum([
  "summer",
  "winter",
  "autumn",
  "spring",
  "rainy",
  "windy",
]);

export const soilTypeEnum = z.enum([
  "sandy",
  "sandy_loam",
  "loamy",
  "clay_loam",
  "clay",
  "silty",
  "saline",
  "rocky",
  "other",
]);

export const budgetBracketEnum = z.enum(["low", "medium", "high", "very_high"]);

export const irrigationTypeEnum = z.enum([
  "rainfed",
  "canal",
  "tubewell",
  "mixed",
]);

export const cropCategoryEnum = z.enum([
  "staple",
  "cash",
  "pulse",
  "vegetable",
]);

function currentYear(): number {
  return new Date().getFullYear();
}

/** target_year: current year .. 2035 */
export const targetYearSchema = z.coerce
  .number()
  .int()
  .min(currentYear())
  .max(2035);

export const createCropRecommendationSchema = z.object({
  farm_id: z.string().uuid("farm_id must be a valid uuid"),
  target_season: seasonEnum,
  target_year: targetYearSchema,
  soil_type: soilTypeEnum,
  irrigation_type: irrigationTypeEnum,
  budget_bracket: budgetBracketEnum,
  regenerate: z.boolean().default(false),
});

export type CreateCropRecommendationInput = z.infer<
  typeof createCropRecommendationSchema
>;

export const listCropRecommendationsQuerySchema = z.object({
  farm_id: z.string().uuid().optional(),
  target_season: seasonEnum.optional(),
  target_year: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  cursor: z.string().uuid().optional(),
});

export type ListCropRecommendationsQuery = z.infer<
  typeof listCropRecommendationsQuerySchema
>;

export const cropCatalogueQuerySchema = z.object({
  season: seasonEnum.optional(),
  category: cropCategoryEnum.optional(),
  locale: z.string().optional(),
});

export type CropCatalogueQuery = z.infer<typeof cropCatalogueQuerySchema>;

export const saveRecommendationSchema = z.object({
  recommendation_id: z.string().uuid("recommendation_id must be a valid uuid"),
});

export type SaveRecommendationInput = z.infer<typeof saveRecommendationSchema>;

export const getSavedPlanQuerySchema = z.object({
  farm_id: z.string().uuid("farm_id must be a valid uuid"),
  season: seasonEnum,
  year: z.coerce.number().int(),
});

export type GetSavedPlanQuery = z.infer<typeof getSavedPlanQuerySchema>;
