export type FarmHealth = 'good' | 'watch';

export function computeFarmHealth(
  growthStages: Record<string, string>,
  recentRecords: { type: string; event_date: string }[],
): FarmHealth {
  const recordTypes = recentRecords.map((r) => r.type);
  const hasIrrigation = recordTypes.some((t) => t === 'irrigation' || t === 'fertilizer' || t === 'pesticide');
  const hasHarvest = recordTypes.some((t) => t === 'harvest');
  const hasDisease = recordTypes.some((t) => t === 'disease');
  if (hasDisease) return 'watch';
  if (!hasIrrigation && !hasHarvest && recentRecords.length === 0) return 'watch';
  return 'good';
}
