import { describe, expect, it } from "vitest";
import {
  createCropRecommendationSchema,
  listCropRecommendationsQuerySchema,
  saveRecommendationSchema,
  getSavedPlanQuerySchema,
} from "@/lib/validation/crops";

describe("createCropRecommendationSchema", () => {
  it("accepts valid input", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      target_season: "winter",
      target_year: 2026,
      soil_type: "loamy",
      irrigation_type: "canal",
      budget_bracket: "medium",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid farm_id", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "not-a-uuid",
      target_season: "winter",
      target_year: 2026,
      soil_type: "loamy",
      irrigation_type: "canal",
      budget_bracket: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown season", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      target_season: "monsoon",
      target_year: 2026,
      soil_type: "loamy",
      irrigation_type: "canal",
      budget_bracket: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown soil type", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      target_season: "winter",
      target_year: 2026,
      soil_type: "black",
      irrigation_type: "canal",
      budget_bracket: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("defaults regenerate to false", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      target_season: "winter",
      target_year: 2026,
      soil_type: "loamy",
      irrigation_type: "canal",
      budget_bracket: "medium",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.regenerate).toBe(false);
  });

  it("accepts regenerate true", () => {
    const result = createCropRecommendationSchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      target_season: "winter",
      target_year: 2026,
      soil_type: "loamy",
      irrigation_type: "canal",
      budget_bracket: "medium",
      regenerate: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("listCropRecommendationsQuerySchema", () => {
  it("defaults limit to 20", () => {
    const result = listCropRecommendationsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it("clamps limit to 50", () => {
    const result = listCropRecommendationsQuerySchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});

describe("saveRecommendationSchema", () => {
  it("accepts valid recommendation_id", () => {
    const result = saveRecommendationSchema.safeParse({
      recommendation_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-uuid", () => {
    const result = saveRecommendationSchema.safeParse({ recommendation_id: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("getSavedPlanQuerySchema", () => {
  it("requires farm_id season and year", () => {
    const result = getSavedPlanQuerySchema.safeParse({
      farm_id: "00000000-0000-0000-0000-000000000000",
      season: "winter",
      year: 2026,
    });
    expect(result.success).toBe(true);
  });
});
