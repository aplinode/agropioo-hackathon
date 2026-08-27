import { STAGE_SEQUENCES, DEFAULT_STAGE } from './constants';

export type StageMap = Record<string, string>;

export function defaultStagesForCrops(crops: string[]): StageMap {
  const map: StageMap = {};
  for (const crop of crops) {
    const key = crop.toLowerCase();
    const sequence = STAGE_SEQUENCES[key] ?? STAGE_SEQUENCES.wheat;
    map[key] = sequence[0];
  }
  return map;
}

export function autoAdvanceStage(stageMap: StageMap, recordType: string, crop: string): StageMap {
  const key = crop.toLowerCase();
  const current = stageMap[key];
  const sequence = STAGE_SEQUENCES[key] ?? STAGE_SEQUENCES.wheat;
  const currentIndex = sequence.indexOf(current ?? DEFAULT_STAGE);

  if (recordType === 'sowing' || recordType === 'planting') {
    if (current && current !== DEFAULT_STAGE) return stageMap;
    const newIndex = Math.max(currentIndex, 1);
    if (newIndex !== currentIndex) {
      return { ...stageMap, [key]: sequence[newIndex] };
    }
  } else if (recordType === 'harvest') {
    const newIndex = sequence.length - 1;
    if (newIndex !== currentIndex) {
      return { ...stageMap, [key]: sequence[newIndex] };
    }
  }
  return stageMap;
}

export function computeCurrentStage(stageMap: StageMap, crop: string): string {
  const key = crop.toLowerCase();
  return stageMap[key] ?? DEFAULT_STAGE;
}

export function isStageDefault(stageMap: StageMap, crop: string): boolean {
  const key = crop.toLowerCase();
  const current = stageMap[key] ?? DEFAULT_STAGE;
  return current === DEFAULT_STAGE;
}
