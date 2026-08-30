/**
 * Maps the 38 PlantVillage class labels returned by the Hugging Face model
 * `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` to structured,
 * translatable disease advice (spec FR-4, FR-8.4; plan D4).
 *
 * Every visible string is a catalog key resolved at runtime via
 * `getDictionary(locale)` — nothing is hardcoded in English here
 * (plan D8). The catalog keys live in `catalog/en.ts`.
 */

import type { CatalogKey } from "@/catalog";

export type Severity = "watch" | "treat_now" | "clear";

export interface DiseaseAdvice {
  diseaseNameKey: CatalogKey;
  cropKey: CatalogKey;
  severity: Severity;
  causesKey: CatalogKey;
  stepsKeys: CatalogKey[];
  rescanKey: CatalogKey;
  cautionKey: CatalogKey;
}

/** Rescan timing options (reused across diseases). */
const RESCAN = {
  SOON: "app.detect.rescan.7" as CatalogKey,
  MEDIUM: "app.detect.rescan.14" as CatalogKey,
  LATE: "app.detect.rescan.21" as CatalogKey,
} as const;

/** Shared caution applied to every diagnosis (plan D8). */
const CAUTION = "app.detect.caution" as CatalogKey;

/**
 * Mapping from the exact Hugging Face label string → structured advice.
 * Labels come verbatim from the model's `config.json` id2label mapping.
 */
const CLASS_MAP: Record<string, DiseaseAdvice> = {
  // Apple
  "Apple Scab": {
    diseaseNameKey: "app.detect.disease.apple_scab.name",
    cropKey: "app.detect.crop.apple",
    severity: "treat_now",
    causesKey: "app.detect.disease.apple_scab.causes",
    stepsKeys: [
      "app.detect.disease.apple_scab.steps.0",
      "app.detect.disease.apple_scab.steps.1",
      "app.detect.disease.apple_scab.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Apple with Black Rot": {
    diseaseNameKey: "app.detect.disease.apple_black_rot.name",
    cropKey: "app.detect.crop.apple",
    severity: "treat_now",
    causesKey: "app.detect.disease.apple_black_rot.causes",
    stepsKeys: [
      "app.detect.disease.apple_black_rot.steps.0",
      "app.detect.disease.apple_black_rot.steps.1",
      "app.detect.disease.apple_black_rot.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Cedar Apple Rust": {
    diseaseNameKey: "app.detect.disease.apple_cedar_rust.name",
    cropKey: "app.detect.crop.apple",
    severity: "treat_now",
    causesKey: "app.detect.disease.apple_cedar_rust.causes",
    stepsKeys: [
      "app.detect.disease.apple_cedar_rust.steps.0",
      "app.detect.disease.apple_cedar_rust.steps.1",
      "app.detect.disease.apple_cedar_rust.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Healthy Apple": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.apple",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Blueberry
  "Healthy Blueberry Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.blueberry",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Cherry
  "Cherry with Powdery Mildew": {
    diseaseNameKey: "app.detect.disease.cherry_powdery_mildew.name",
    cropKey: "app.detect.crop.cherry",
    severity: "treat_now",
    causesKey: "app.detect.disease.cherry_powdery_mildew.causes",
    stepsKeys: [
      "app.detect.disease.cherry_powdery_mildew.steps.0",
      "app.detect.disease.cherry_powdery_mildew.steps.1",
      "app.detect.disease.cherry_powdery_mildew.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Healthy Cherry Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.cherry",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Corn (Maize)
  "Corn (Maize) with Cercospora and Gray Leaf Spot": {
    diseaseNameKey: "app.detect.disease.corn_gray_leaf_spot.name",
    cropKey: "app.detect.crop.corn",
    severity: "treat_now",
    causesKey: "app.detect.disease.corn_gray_leaf_spot.causes",
    stepsKeys: [
      "app.detect.disease.corn_gray_leaf_spot.steps.0",
      "app.detect.disease.corn_gray_leaf_spot.steps.1",
      "app.detect.disease.corn_gray_leaf_spot.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Corn (Maize) with Common Rust": {
    diseaseNameKey: "app.detect.disease.corn_common_rust.name",
    cropKey: "app.detect.crop.corn",
    severity: "watch",
    causesKey: "app.detect.disease.corn_common_rust.causes",
    stepsKeys: [
      "app.detect.disease.corn_common_rust.steps.0",
      "app.detect.disease.corn_common_rust.steps.1",
      "app.detect.disease.corn_common_rust.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Corn (Maize) with Northern Leaf Blight": {
    diseaseNameKey: "app.detect.disease.corn_northern_leaf_blight.name",
    cropKey: "app.detect.crop.corn",
    severity: "treat_now",
    causesKey: "app.detect.disease.corn_northern_leaf_blight.causes",
    stepsKeys: [
      "app.detect.disease.corn_northern_leaf_blight.steps.0",
      "app.detect.disease.corn_northern_leaf_blight.steps.1",
      "app.detect.disease.corn_northern_leaf_blight.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Healthy Corn (Maize) Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.corn",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Grape
  "Grape with Black Rot": {
    diseaseNameKey: "app.detect.disease.grape_black_rot.name",
    cropKey: "app.detect.crop.grape",
    severity: "treat_now",
    causesKey: "app.detect.disease.grape_black_rot.causes",
    stepsKeys: [
      "app.detect.disease.grape_black_rot.steps.0",
      "app.detect.disease.grape_black_rot.steps.1",
      "app.detect.disease.grape_black_rot.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Grape with Esca (Black Measles)": {
    diseaseNameKey: "app.detect.disease.grape_esca.name",
    cropKey: "app.detect.crop.grape",
    severity: "treat_now",
    causesKey: "app.detect.disease.grape_esca.causes",
    stepsKeys: [
      "app.detect.disease.grape_esca.steps.0",
      "app.detect.disease.grape_esca.steps.1",
      "app.detect.disease.grape_esca.steps.2",
    ],
    rescanKey: RESCAN.LATE,
    cautionKey: CAUTION,
  },
  "Grape with Isariopsis Leaf Spot": {
    diseaseNameKey: "app.detect.disease.grape_leaf_blight.name",
    cropKey: "app.detect.crop.grape",
    severity: "watch",
    causesKey: "app.detect.disease.grape_leaf_blight.causes",
    stepsKeys: [
      "app.detect.disease.grape_leaf_blight.steps.0",
      "app.detect.disease.grape_leaf_blight.steps.1",
      "app.detect.disease.grape_leaf_blight.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Healthy Grape Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.grape",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Orange
  "Orange with Citrus Greening": {
    diseaseNameKey: "app.detect.disease.orange_huanglongbing.name",
    cropKey: "app.detect.crop.orange",
    severity: "treat_now",
    causesKey: "app.detect.disease.orange_huanglongbing.causes",
    stepsKeys: [
      "app.detect.disease.orange_huanglongbing.steps.0",
      "app.detect.disease.orange_huanglongbing.steps.1",
      "app.detect.disease.orange_huanglongbing.steps.2",
    ],
    rescanKey: RESCAN.LATE,
    cautionKey: CAUTION,
  },

  // Peach
  "Peach with Bacterial Spot": {
    diseaseNameKey: "app.detect.disease.peach_bacterial_spot.name",
    cropKey: "app.detect.crop.peach",
    severity: "treat_now",
    causesKey: "app.detect.disease.peach_bacterial_spot.causes",
    stepsKeys: [
      "app.detect.disease.peach_bacterial_spot.steps.0",
      "app.detect.disease.peach_bacterial_spot.steps.1",
      "app.detect.disease.peach_bacterial_spot.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Healthy Peach Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.peach",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Bell Pepper
  "Bell Pepper with Bacterial Spot": {
    diseaseNameKey: "app.detect.disease.pepper_bacterial_spot.name",
    cropKey: "app.detect.crop.pepper",
    severity: "treat_now",
    causesKey: "app.detect.disease.pepper_bacterial_spot.causes",
    stepsKeys: [
      "app.detect.disease.pepper_bacterial_spot.steps.0",
      "app.detect.disease.pepper_bacterial_spot.steps.1",
      "app.detect.disease.pepper_bacterial_spot.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Healthy Bell Pepper Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.pepper",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Potato
  "Potato with Early Blight": {
    diseaseNameKey: "app.detect.disease.potato_early_blight.name",
    cropKey: "app.detect.crop.potato",
    severity: "watch",
    causesKey: "app.detect.disease.potato_early_blight.causes",
    stepsKeys: [
      "app.detect.disease.potato_early_blight.steps.0",
      "app.detect.disease.potato_early_blight.steps.1",
      "app.detect.disease.potato_early_blight.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Potato with Late Blight": {
    diseaseNameKey: "app.detect.disease.potato_late_blight.name",
    cropKey: "app.detect.crop.potato",
    severity: "treat_now",
    causesKey: "app.detect.disease.potato_late_blight.causes",
    stepsKeys: [
      "app.detect.disease.potato_late_blight.steps.0",
      "app.detect.disease.potato_late_blight.steps.1",
      "app.detect.disease.potato_late_blight.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Healthy Potato Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.potato",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Raspberry
  "Healthy Raspberry Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.raspberry",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Soybean
  "Healthy Soybean Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.soybean",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Squash
  "Squash with Powdery Mildew": {
    diseaseNameKey: "app.detect.disease.squash_powdery_mildew.name",
    cropKey: "app.detect.crop.squash",
    severity: "treat_now",
    causesKey: "app.detect.disease.squash_powdery_mildew.causes",
    stepsKeys: [
      "app.detect.disease.squash_powdery_mildew.steps.0",
      "app.detect.disease.squash_powdery_mildew.steps.1",
      "app.detect.disease.squash_powdery_mildew.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Strawberry
  "Strawberry with Leaf Scorch": {
    diseaseNameKey: "app.detect.disease.strawberry_leaf_scorch.name",
    cropKey: "app.detect.crop.strawberry",
    severity: "watch",
    causesKey: "app.detect.disease.strawberry_leaf_scorch.causes",
    stepsKeys: [
      "app.detect.disease.strawberry_leaf_scorch.steps.0",
      "app.detect.disease.strawberry_leaf_scorch.steps.1",
      "app.detect.disease.strawberry_leaf_scorch.steps.2",
    ],
    rescanKey: RESCAN.MEDIUM,
    cautionKey: CAUTION,
  },
  "Healthy Strawberry Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.strawberry",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },

  // Tomato
  "Tomato with Bacterial Spot": {
    diseaseNameKey: "app.detect.disease.tomato_bacterial_spot.name",
    cropKey: "app.detect.crop.tomato",
    severity: "treat_now",
    causesKey: "app.detect.disease.tomato_bacterial_spot.causes",
    stepsKeys: [
      "app.detect.disease.tomato_bacterial_spot.steps.0",
      "app.detect.disease.tomato_bacterial_spot.steps.1",
      "app.detect.disease.tomato_bacterial_spot.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Early Blight": {
    diseaseNameKey: "app.detect.disease.tomato_early_blight.name",
    cropKey: "app.detect.crop.tomato",
    severity: "watch",
    causesKey: "app.detect.disease.tomato_early_blight.causes",
    stepsKeys: [
      "app.detect.disease.tomato_early_blight.steps.0",
      "app.detect.disease.tomato_early_blight.steps.1",
      "app.detect.disease.tomato_early_blight.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Late Blight": {
    diseaseNameKey: "app.detect.disease.tomato_late_blight.name",
    cropKey: "app.detect.crop.tomato",
    severity: "treat_now",
    causesKey: "app.detect.disease.tomato_late_blight.causes",
    stepsKeys: [
      "app.detect.disease.tomato_late_blight.steps.0",
      "app.detect.disease.tomato_late_blight.steps.1",
      "app.detect.disease.tomato_late_blight.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Leaf Mold": {
    diseaseNameKey: "app.detect.disease.tomato_leaf_mold.name",
    cropKey: "app.detect.crop.tomato",
    severity: "watch",
    causesKey: "app.detect.disease.tomato_leaf_mold.causes",
    stepsKeys: [
      "app.detect.disease.tomato_leaf_mold.steps.0",
      "app.detect.disease.tomato_leaf_mold.steps.1",
      "app.detect.disease.tomato_leaf_mold.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Septoria Leaf Spot": {
    diseaseNameKey: "app.detect.disease.tomato_septoria.name",
    cropKey: "app.detect.crop.tomato",
    severity: "watch",
    causesKey: "app.detect.disease.tomato_septoria.causes",
    stepsKeys: [
      "app.detect.disease.tomato_septoria.steps.0",
      "app.detect.disease.tomato_septoria.steps.1",
      "app.detect.disease.tomato_septoria.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Spider Mites or Two-spotted Spider Mite": {
    diseaseNameKey: "app.detect.disease.tomato_spider_mites.name",
    cropKey: "app.detect.crop.tomato",
    severity: "watch",
    causesKey: "app.detect.disease.tomato_spider_mites.causes",
    stepsKeys: [
      "app.detect.disease.tomato_spider_mites.steps.0",
      "app.detect.disease.tomato_spider_mites.steps.1",
      "app.detect.disease.tomato_spider_mites.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato with Target Spot": {
    diseaseNameKey: "app.detect.disease.tomato_target_spot.name",
    cropKey: "app.detect.crop.tomato",
    severity: "watch",
    causesKey: "app.detect.disease.tomato_target_spot.causes",
    stepsKeys: [
      "app.detect.disease.tomato_target_spot.steps.0",
      "app.detect.disease.tomato_target_spot.steps.1",
      "app.detect.disease.tomato_target_spot.steps.2",
    ],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
  "Tomato Yellow Leaf Curl Virus": {
    diseaseNameKey: "app.detect.disease.tomato_ylcv.name",
    cropKey: "app.detect.crop.tomato",
    severity: "treat_now",
    causesKey: "app.detect.disease.tomato_ylcv.causes",
    stepsKeys: [
      "app.detect.disease.tomato_ylcv.steps.0",
      "app.detect.disease.tomato_ylcv.steps.1",
      "app.detect.disease.tomato_ylcv.steps.2",
    ],
    rescanKey: RESCAN.LATE,
    cautionKey: CAUTION,
  },
  "Tomato Mosaic Virus": {
    diseaseNameKey: "app.detect.disease.tomato_mosaic_virus.name",
    cropKey: "app.detect.crop.tomato",
    severity: "treat_now",
    causesKey: "app.detect.disease.tomato_mosaic_virus.causes",
    stepsKeys: [
      "app.detect.disease.tomato_mosaic_virus.steps.0",
      "app.detect.disease.tomato_mosaic_virus.steps.1",
      "app.detect.disease.tomato_mosaic_virus.steps.2",
    ],
    rescanKey: RESCAN.LATE,
    cautionKey: CAUTION,
  },
  "Healthy Tomato Plant": {
    diseaseNameKey: "app.detect.healthy.name",
    cropKey: "app.detect.crop.tomato",
    severity: "clear",
    causesKey: "app.detect.healthy.causes",
    stepsKeys: ["app.detect.healthy.steps.0"],
    rescanKey: RESCAN.SOON,
    cautionKey: CAUTION,
  },
};

/**
 * Resolve a raw Hugging Face label to structured advice.
 * Returns null for unrecognised labels so the handler can fall back to
 * FR-3.4 ("Could not identify"). Tries an exact match first, then a
 * normalised (lower-cased, separator-collapsed) match for robustness.
 */
const NORMALISED_MAP: Record<string, DiseaseAdvice> = {};
for (const [label, advice] of Object.entries(CLASS_MAP)) {
  const key = label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  NORMALISED_MAP[key] = advice;
}

export function resolveClass(rawLabel: string): DiseaseAdvice | null {
  if (rawLabel in CLASS_MAP) return CLASS_MAP[rawLabel];
  const normalised = rawLabel
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return NORMALISED_MAP[normalised] ?? null;
}

/** The exact 38 labels the model is trained on (exported for tests). */
export const PLANTVILLAGE_LABELS = Object.keys(CLASS_MAP);
