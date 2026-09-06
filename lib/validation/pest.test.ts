import { describe, expect, it } from 'vitest';
import {
  forecastQuerySchema,
  alertsQuerySchema,
  alertIdSchema,
  growthStageSchema,
} from '@/lib/validation/pest';

describe('forecastQuerySchema', () => {
  it('accepts valid farm_id', () => {
    const result = forecastQuerySchema.safeParse({ farm_id: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.success).toBe(true);
  });

  it('rejects missing farm_id', () => {
    const result = forecastQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid uuid', () => {
    const result = forecastQuerySchema.safeParse({ farm_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('alertsQuerySchema', () => {
  it('accepts empty params', () => {
    const result = alertsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid limit', () => {
    const result = alertsQuerySchema.safeParse({ limit: '50' });
    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(50);
  });

  it('rejects limit over 100', () => {
    const result = alertsQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });
});

describe('alertIdSchema', () => {
  it('accepts valid id', () => {
    const result = alertIdSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid id', () => {
    const result = alertIdSchema.safeParse({ id: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('growthStageSchema', () => {
  it('accepts valid input', () => {
    const result = growthStageSchema.safeParse({
      farm_id: '123e4567-e89b-12d3-a456-426614174000',
      crop: 'wheat',
      stage: 'flowering',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing farm_id', () => {
    const result = growthStageSchema.safeParse({ crop: 'wheat', stage: 'flowering' });
    expect(result.success).toBe(false);
  });

  it('rejects empty crop', () => {
    const result = growthStageSchema.safeParse({
      farm_id: '123e4567-e89b-12d3-a456-426614174000',
      crop: '',
      stage: 'flowering',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty stage', () => {
    const result = growthStageSchema.safeParse({
      farm_id: '123e4567-e89b-12d3-a456-426614174000',
      crop: 'wheat',
      stage: '',
    });
    expect(result.success).toBe(false);
  });
});
