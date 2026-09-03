import * as tf from "@tensorflow/tfjs";
import type { CropSummary } from "./api-types";
import type { ScoreContext, ScoredCrop } from "./scoring";
import { rankCandidates, revenuePerAcre, scoreCrop } from "./scoring";

let modelPromise: Promise<tf.GraphModel | null> | null = null;

export class ModelLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelLoadError";
  }
}

async function loadModel(): Promise<tf.GraphModel | null> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const model = await tf.loadGraphModel("/models/crop-scoring/model.json");
        return model;
      } catch {
        return null;
      }
    })();
  }
  return modelPromise;
}

export async function scoreWithModel(
  crops: CropSummary[],
  ctx: ScoreContext,
): Promise<{ scored: ScoredCrop[]; usedFallback: boolean }> {
  const model = await loadModel();
  if (!model) {
    return { scored: rankCandidates(crops, ctx, 3), usedFallback: true };
  }

  try {
    const priceInfo = ctx.priceByCrop;
    const inputs: number[][] = [];
    for (const crop of crops) {
      const price = priceInfo[crop.id];
      const revenue = ctx.marketAvailable && price ? revenuePerAcre(crop, price.pricePerMaanPkr) : 0;
      const row = [
        ctx.soilType === "loamy" ? 1 : 0,
        ctx.irrigation === "canal" ? 1 : 0,
        ctx.budget === "medium" ? 1 : 0,
        ctx.season === "winter" ? 1 : 0,
        crop.waterRequirementLevel === "medium" ? 1 : 0,
        crop.category === "staple" ? 1 : 0,
        revenue / 100000,
        crop.capitalRequirementPerAcrePkr / 100000,
        ctx.weatherAvailable ? 1 : 0,
        ctx.marketAvailable ? 1 : 0,
      ];
      inputs.push(row);
    }

    const tensor = tf.tensor2d(inputs);
    const output = model.execute(tensor) as tf.Tensor;
    const scores = await output.data();
    tensor.dispose();
    output.dispose();

    const scored = crops
      .map((crop, i) => {
        const base = scoreCrop(crop, ctx);
        const modelScore = Number(scores[i] ?? base.scores.final);
        return {
          ...base,
          scores: { ...base.scores, final: Math.max(0, Math.min(1, modelScore)) },
        };
      })
      .sort((a, b) => b.scores.final - a.scores.final)
      .slice(0, 3);

    return { scored, usedFallback: false };
  } catch {
    return { scored: rankCandidates(crops, ctx, 3), usedFallback: true };
  }
}
