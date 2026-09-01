export type Season = "summer" | "winter" | "autumn" | "spring" | "rainy" | "windy";
export type SoilType =
  | "sandy"
  | "sandy_loam"
  | "loamy"
  | "clay_loam"
  | "clay"
  | "silty"
  | "saline"
  | "rocky"
  | "other";
export type BudgetBracket = "low" | "medium" | "high" | "very_high";
export type IrrigationType = "rainfed" | "canal" | "tubewell" | "mixed";
export type CropCategory = "staple" | "cash" | "pulse" | "vegetable";

export type Confidence = "full" | "degraded" | "missing";
export type RevenueConfidence = "high" | "medium" | "low" | "unreliable";
export type WaterLevel = "low" | "medium" | "high";

export type CropSummary = {
  id: string;
  nameEn: string;
  nameKey: string;
  category: CropCategory;
  typicalYieldPerAcreKg: number;
  growingDurationDays: number;
  seasonWindows: Season[];
  waterRequirementLevel: WaterLevel;
  labourCostLevel: WaterLevel;
  capitalRequirementPerAcrePkr: number;
  marketRiskBaseline: "low" | "medium" | "high";
};

export type RecommendationScores = {
  suitability: number;
  weatherFit: number;
  profitability: number;
  risk: number;
  sustainability: number;
  final: number;
};

export type CropRecommendation = {
  id: string;
  rank: number;
  crop: CropSummary;
  expectedRevenuePerAcrePkr: number;
  revenueConfidence: RevenueConfidence;
  reasonKey: string;
  riskFactors: string[];
  waterRequirementLevel: WaterLevel;
  scores: RecommendationScores;
  dataSourcesUsed: string[];
  dataFreshnessSeconds: number;
};

export type CropRecommendationRequest = {
  id: string;
  farmId: string;
  targetSeason: Season;
  targetYear: number;
  soilType: SoilType;
  soilIsRegionalDefault: boolean;
  irrigationType: IrrigationType;
  budgetBracket: BudgetBracket;
  confidence: { weather: Confidence; market: Confidence; soil: Confidence };
  createdAt: string;
};

export type RotationSuggestion = {
  sequencePosition: number;
  targetSeason: Season;
  targetYear: number;
  crop: CropSummary;
  reasonKey: string;
  isGeneric: boolean;
};

export type FarmPlanEntry = {
  id: string;
  farmId: string;
  recommendationId: string;
  targetSeason: Season;
  targetYear: number;
  rotationSuggestions: RotationSuggestion[];
};

export type RecommendCropsInput = {
  farmId: string;
  targetSeason: Season;
  targetYear: number;
  soilType: SoilType;
  irrigationType: IrrigationType;
  budgetBracket: BudgetBracket;
  regenerate?: boolean;
};
