import { describe, it, expect } from 'vitest';
import { defaultStagesForCrops, autoAdvanceStage, isStageDefault } from '@/lib/farms/growth-stages';

describe('defaultStagesForCrops', () => {
  it('returns Sowing for all crops', () => {
    const map = defaultStagesForCrops(['wheat', 'cotton']);
    expect(map).toEqual({ wheat: 'Sowing', cotton: 'Sowing' });
  });

  it('falls back to wheat for unknown crop', () => {
    const map = defaultStagesForCrops(['unknown']);
    expect(map).toEqual({ unknown: 'Sowing' });
  });
});

describe('autoAdvanceStage', () => {
  it('advances sowing/planting to stage 1 when default', () => {
    const map = { wheat: 'Sowing' };
    const next = autoAdvanceStage(map, 'sowing', 'wheat');
    expect(next).toEqual({ wheat: 'Tillering' });
  });

  it('sets harvest to final stage', () => {
    const map = { wheat: 'Vegetative' };
    const next = autoAdvanceStage(map, 'harvest', 'wheat');
    expect(next).toEqual({ wheat: 'Ready' });
  });

  it('skips auto-advance when already overridden', () => {
    const map = { wheat: 'Vegetative' };
    const next = autoAdvanceStage(map, 'sowing', 'wheat');
    expect(next).toEqual(map);
  });
});

describe('isStageDefault', () => {
  it('returns true for default stage', () => {
    expect(isStageDefault({ wheat: 'Sowing' }, 'wheat')).toBe(true);
  });
  it('returns false for overridden stage', () => {
    expect(isStageDefault({ wheat: 'Vegetative' }, 'wheat')).toBe(false);
  });
});
