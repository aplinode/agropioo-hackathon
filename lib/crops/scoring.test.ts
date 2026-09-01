import type { CropSummary } from "@/lib/crops/api-types";
import { describe, expect, it } from "vitest";
import { rankCandidates } from "@/lib/crops/scoring";
import type { ScoreContext } from "@/lib/crops/scoring";

function makeCrop(partial: Partial<CropSummary> & { id: string; nameEn: string }): CropSummary {
  return {
    nameKey: partial.id,
    category: partial.category ?? "staple",
    typicalYieldPerAcreKg: partial.typicalYieldPerAcreKg ?? 800,
    growingDurationDays: partial.growingDurationDays ?? 120,
    seasonWindows: partial.seasonWindows ?? ["winter"],
    waterRequirementLevel: partial.waterRequirementLevel ?? "medium",
    labourCostLevel: partial.labourCostLevel ?? "medium",
    capitalRequirementPerAcrePkr: partial.capitalRequirementPerAcrePkr ?? 18000,
    marketRiskBaseline: partial.marketRiskBaseline ?? "low",
    ...partial,
  };
}

describe("scoring engine reference scenarios", () => {
  const wheat = makeCrop({
    id: "wheat-id",
    nameEn: "Wheat",
    category: "staple",
    typicalYieldPerAcreKg: 800,
    growingDurationDays: 120,
    capitalRequirementPerAcrePkr: 18000,
    marketRiskBaseline: "low",
    waterRequirementLevel: "medium",
    seasonWindows: ["winter"],
  });
  const mung = makeCrop({
    id: "mung-id",
    nameEn: "Mung Bean",
    category: "pulse",
    typicalYieldPerAcreKg: 300,
    growingDurationDays: 75,
    capitalRequirementPerAcrePkr: 14000,
    marketRiskBaseline: "low",
    waterRequirementLevel: "low",
    seasonWindows: ["summer", "rainy"],
  });
  const chickpea = makeCrop({
    id: "chickpea-id",
    nameEn: "Chickpea",
    category: "pulse",
    typicalYieldPerAcreKg: 350,
    growingDurationDays: 130,
    capitalRequirementPerAcrePkr: 15000,
    marketRiskBaseline: "low",
    waterRequirementLevel: "low",
    seasonWindows: ["winter"],
  });
  const rice = makeCrop({
    id: "rice-id",
    nameEn: "Rice",
    category: "staple",
    typicalYieldPerAcreKg: 1200,
    growingDurationDays: 150,
    capitalRequirementPerAcrePkr: 75000,
    marketRiskBaseline: "medium",
    waterRequirementLevel: "high",
    seasonWindows: ["rainy", "summer"],
  });
  const maize = makeCrop({
    id: "maize-id",
    nameEn: "Maize",
    category: "staple",
    typicalYieldPerAcreKg: 1600,
    growingDurationDays: 110,
    capitalRequirementPerAcrePkr: 22000,
    marketRiskBaseline: "low",
    waterRequirementLevel: "medium",
    seasonWindows: ["summer", "spring"],
  });
  const cotton = makeCrop({
    id: "cotton-id",
    nameEn: "Cotton",
    category: "cash",
    typicalYieldPerAcreKg: 600,
    growingDurationDays: 160,
    capitalRequirementPerAcrePkr: 55000,
    marketRiskBaseline: "high",
    waterRequirementLevel: "medium",
    seasonWindows: ["summer", "rainy"],
  });
  const potato = makeCrop({
    id: "potato-id",
    nameEn: "Potato",
    category: "vegetable",
    typicalYieldPerAcreKg: 9000,
    growingDurationDays: 90,
    capitalRequirementPerAcrePkr: 70000,
    marketRiskBaseline: "medium",
    waterRequirementLevel: "medium",
    seasonWindows: ["winter", "autumn"],
  });

  const baseCtx = (overrides: Partial<ScoreContext> = {}): ScoreContext => ({
    soilType: "loamy",
    season: "winter",
    budget: "medium",
    irrigation: "canal",
    weatherAvailable: true,
    marketAvailable: true,
    soilConfidence: "full",
    compatibilityByCrop: {
      [wheat.id]: 1,
      [mung.id]: 0.9,
      [chickpea.id]: 0.88,
      [rice.id]: 0.75,
      [maize.id]: 0.8,
      [cotton.id]: 0.7,
      [potato.id]: 0.65,
    },
    priceByCrop: {
      [wheat.id]: { pricePerMaanPkr: 2500, trend: "up", volatility: 0.12 },
      [mung.id]: { pricePerMaanPkr: 4800, trend: "stable", volatility: 0.2 },
      [chickpea.id]: { pricePerMaanPkr: 6200, trend: "stable", volatility: 0.16 },
      [rice.id]: { pricePerMaanPkr: 3400, trend: "stable", volatility: 0.15 },
      [maize.id]: { pricePerMaanPkr: 2200, trend: "up", volatility: 0.18 },
      [cotton.id]: { pricePerMaanPkr: 7200, trend: "down", volatility: 0.28 },
      [potato.id]: { pricePerMaanPkr: 2600, trend: "down", volatility: 0.35 },
    },
    ...overrides,
  });

  it("wheat-after-cotton in Punjab (winter) ranks wheat first with mung and chickpea", () => {
    const ranked = rankCandidates([wheat, mung, chickpea, rice, maize, cotton, potato], {
      ...baseCtx(),
      season: "winter",
      lastCropCategory: "cash",
    }, 3);
    const names = ranked.map((r) => r.crop.nameEn);
    expect(names[0]).toBe("Wheat");
    expect(names).toContain("Mung Bean");
    expect(names).toContain("Chickpea");
  });

  it("rice-after-wheat in Sindh (rainy) returns 3 recommendations", () => {
    const ranked = rankCandidates([wheat, rice, maize, chickpea, mung, cotton, potato], {
      ...baseCtx(),
      season: "rainy",
      compatibilityByCrop: {
        [wheat.id]: 1,
        [rice.id]: 0.95,
        [maize.id]: 0.78,
        [chickpea.id]: 0.8,
        [mung.id]: 0.85,
        [cotton.id]: 0.7,
        [potato.id]: 0.65,
      },
    }, 3);
    expect(ranked).toHaveLength(3);
  });

  it("maize-after-potato in KP (summer) returns 3 recommendations", () => {
    const ranked = rankCandidates([wheat, maize, mung, chickpea, potato, rice, cotton], {
      ...baseCtx(),
      season: "summer",
      lastCropCategory: "vegetable",
    }, 3);
    expect(ranked).toHaveLength(3);
  });

  it("returns exactly 3 recommendations", () => {
    const ranked = rankCandidates([wheat, rice, maize], baseCtx(), 3);
    expect(ranked).toHaveLength(3);
  });
});
