import "server-only";

import type { ForecastDay, ForecastResult } from "./openweather";

/* Advisory generation engine (research §2). Deterministic, rule-based, keyed on
   crop growth stage + weather thresholds. The engine returns stable translation
   keys (advice_key); text is resolved server-side at render time so the language
   switcher works without regeneration. */

export type GrowthStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "maturation"
  | "harvestReady"
  | "generic";

export const GROWTH_STAGES: GrowthStage[] = [
  "seedling",
  "vegetative",
  "flowering",
  "maturation",
  "harvestReady",
  "generic",
];

export type Severity = "info" | "warning" | "critical";

export type AdvisoryDay = {
  date: string;
  weather: {
    temp_max: number;
    temp_min: number;
    precip_mm: number;
    humidity: number;
    description: string;
  };
  growth_stage: GrowthStage;
  advice_key: string;
  severity: Severity;
};

/* Simplified average crop durations (days) for stage buckets. Local variety
   specifics are a future enhancement (research — Open Risks). */
const CROP_DURATIONS: Record<string, number> = {
  wheat: 120,
  rice: 120,
  cotton: 160,
  maize: 100,
  sugarcane: 330,
  barley: 130,
  mustard: 130,
  sunflower: 110,
  millet: 90,
  sorghum: 110,
  gram: 130,
  lentil: 150,
  potato: 110,
  tomato: 120,
  onion: 150,
};
const DEFAULT_DURATION = 120;

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function computeGrowthStage(
  primaryCrop: string | null,
  sowingDate: string | null,
  refDate: string,
): GrowthStage {
  if (!primaryCrop || !sowingDate) return "generic";
  const elapsed = daysBetween(sowingDate, refDate);
  if (elapsed < 0 || Number.isNaN(elapsed)) return "generic";

  const duration = CROP_DURATIONS[primaryCrop.toLowerCase()] ?? DEFAULT_DURATION;
  const frac = elapsed / duration;
  if (frac < 0.15) return "seedling";
  if (frac < 0.45) return "vegetative";
  if (frac < 0.7) return "flowering";
  if (frac < 0.92) return "maturation";
  return "harvestReady";
}

/* Pick the actionable recommendation for one day given crop + stage + weather.
   Order matters: the most time-sensitive, yield-threatening condition wins. */
export function generateDayAdvice(
  day: ForecastDay,
  primaryCrop: string | null,
  stage: GrowthStage,
): { advice_key: string; severity: Severity } {
  if (day.precip_mm >= 10) {
    return {
      advice_key: "app.weather.advisory.recommendation.irrigation",
      severity: "warning",
    };
  }
  if (day.temp_max > 40) {
    return {
      advice_key: "app.weather.advisory.recommendation.heatProtect",
      severity: "warning",
    };
  }
  if (day.temp_min < 2) {
    return {
      advice_key: "app.weather.advisory.recommendation.frostProtect",
      severity: "warning",
    };
  }
  if (day.humidity >= 80 && day.temp_max >= 20 && day.temp_max <= 30) {
    return {
      advice_key: "app.weather.advisory.recommendation.sprayDisease",
      severity: "warning",
    };
  }
  if (stage === "harvestReady") {
    return {
      advice_key: "app.weather.advisory.recommendation.harvest",
      severity: "info",
    };
  }
  if (stage === "flowering") {
    return {
      advice_key: "app.weather.advisory.recommendation.fertilize",
      severity: "info",
    };
  }
  if (primaryCrop && stage !== "generic") {
    return {
      advice_key: "app.weather.advisory.recommendation.plantCare",
      severity: "info",
    };
  }
  return {
    advice_key: "app.weather.advisory.recommendation.generic",
    severity: "info",
  };
}

export function buildAdvisoryDays(
  primaryCrop: string | null,
  sowingDate: string | null,
  forecast: ForecastResult,
): AdvisoryDay[] {
  return forecast.days.map((day) => {
    const stage = computeGrowthStage(primaryCrop, sowingDate, day.date);
    const { advice_key, severity } = generateDayAdvice(day, primaryCrop, stage);
    return {
      date: day.date,
      weather: {
        temp_max: day.temp_max,
        temp_min: day.temp_min,
        precip_mm: day.precip_mm,
        humidity: day.humidity,
        description: day.description,
      },
      growth_stage: stage,
      advice_key,
      severity,
    };
  });
}
