import { describe, it, expect } from 'vitest';
import {
  createFarmSchema,
  updateFarmSchema,
  createRecordSchema,
  listRecordsQuerySchema,
} from '@/lib/validation/farms';

describe('createFarmSchema', () => {
  it('accepts valid input', () => {
    const result = createFarmSchema.safeParse({
      name: 'Khalilpur',
      location: 'Multan',
      district: 'Multan',
      crops: ['wheat', 'cotton'],
      acres: 12,
      lat: 30.3753,
      lng: 71.3451,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createFarmSchema.safeParse({
      name: '',
      location: 'Multan',
      district: 'Multan',
      crops: ['wheat'],
      acres: 12,
      lat: 30,
      lng: 70,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative acres', () => {
    const result = createFarmSchema.safeParse({
      name: 'Test',
      location: 'X',
      district: 'Multan',
      crops: ['wheat'],
      acres: -1,
      lat: 30,
      lng: 70,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing crops', () => {
    const result = createFarmSchema.safeParse({
      name: 'Test',
      location: 'X',
      district: 'Multan',
      crops: [],
      acres: 12,
      lat: 30,
      lng: 70,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateFarmSchema', () => {
  it('accepts partial input', () => {
    const result = updateFarmSchema.safeParse({ name: 'New name' });
    expect(result.success).toBe(true);
  });
});

describe('createRecordSchema', () => {
  it('accepts valid input', () => {
    const result = createRecordSchema.safeParse({
      farm_id: '00000000-0000-0000-0000-000000000000',
      type: 'irrigation',
      season: 'Summer',
      year: '2024-25',
      event_date: '2024-06-15',
      title: 'Canal turn',
      note: 'Full field',
      weather_condition: 'Sunny',
      yield_qty: null,
      labor_cost: null,
      transport_cost: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid season', () => {
    const result = createRecordSchema.safeParse({
      farm_id: '00000000-0000-0000-0000-000000000000',
      type: 'irrigation',
      season: 'Autumn',
      year: '2024-25',
      event_date: '2024-06-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid uuid', () => {
    const result = createRecordSchema.safeParse({
      farm_id: 'not-a-uuid',
      type: 'irrigation',
      season: 'Summer',
      year: '2024-25',
      event_date: '2024-06-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('listRecordsQuerySchema', () => {
  it('defaults limit to 20', () => {
    const result = listRecordsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it('clamps limit to 100', () => {
    const result = listRecordsQuerySchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});
