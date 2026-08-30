import type { ScoredCrop } from "./scoring";

export type ReasonTemplate = {
  key: string;
  params: Record<string, string>;
};

/**
 * Picks the single most persuasive, plain-language reason for a recommended crop.
 * The chosen key is i18n-parameterised so the UI translates it with the crop,
 * soil, and season names (which themselves come from the translations table).
 */
export function pickReason(
  crop: ScoredCrop,
  ctx: { seasonLabel: string; soilLabel: string },
): ReasonTemplate {
  const s = crop.scores;
  const dims: Array<{ key: string; v: number }> = [
    { key: "app.crops.reason.suitability", v: s.suitability },
    { key: "app.crops.reason.profit", v: s.profitability },
    { key: "app.crops.reason.weather_fit", v: s.weatherFit },
    { key: "app.crops.reason.sustainability", v: s.sustainability },
    { key: "app.crops.reason.low_risk", v: 1 - s.risk },
  ];
  dims.sort((a, b) => b.v - a.v);
  const top = dims[0];
  if (top.v < 0.55) {
    return {
      key: "app.crops.reason.generic",
      params: { crop: crop.crop.nameEn },
    };
  }
  return {
    key: top.key,
    params: {
      crop: crop.crop.nameEn,
      soil: ctx.soilLabel,
      season: ctx.seasonLabel,
    },
  };
}
