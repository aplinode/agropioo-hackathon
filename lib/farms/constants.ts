export const CROPS = [
  'wheat', 'cotton', 'sugarcane', 'maize', 'rice',
  'barley', 'mustard', 'sunflower', 'sesame', 'peanut',
  'millet', 'sorghum', 'gram', 'lentil', 'mung bean',
  'onion', 'potato', 'tomato', 'cauliflower', 'cabbage',
  'carrot', 'radish', 'spinach', 'okra', 'chili',
  'cucumber', 'watermelon', 'muskmelon', 'citrus', 'mango',
  'banana', 'apple', 'grape', 'olive', 'date palm'
] as const;
export type Crop = (typeof CROPS)[number];

export const IRRIGATION_METHODS = ['drip', 'sprinkler', 'flood', 'rainfed'] as const;
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];

export const SOIL_TYPES = ['clay', 'loam', 'sandy', 'silt'] as const;
export type SoilType = (typeof SOIL_TYPES)[number];

export const RECORD_TYPES = ['sowing', 'planting', 'irrigation', 'fertilizer', 'pesticide', 'disease', 'harvest'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const SEASONS = ['Summer', 'Winter', 'Rainy', 'Dry'] as const;
export type Season = (typeof SEASONS)[number];

export const WEATHER_CONDITIONS = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Fog'] as const;
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

export const STAGE_SEQUENCES: Record<string, string[]> = {
  wheat: ['Sowing', 'Tillering', 'Vegetative', 'Grain filling', 'Ready'],
  cotton: ['Sowing', 'Squaring', 'Flowering', 'Boll filling', 'Ready'],
  sugarcane: ['Sowing', 'Tillering', 'Grand growth', 'Ripening', 'Harvest'],
  maize: ['Sowing', 'Vegetative', 'Tasselling', 'Grain filling', 'Ready'],
  rice: ['Sowing', 'Tillering', 'Panicle initiation', 'Grain filling', 'Ready'],
};

export const DEFAULT_STAGE = 'Sowing';

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => {
  const start = CURRENT_YEAR - 10 + i;
  return `${start}-${String(start + 1).slice(-2)}`;
});
