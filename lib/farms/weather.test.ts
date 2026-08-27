import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCurrentWeather, emptySnapshot } from '@/lib/farms/weather';

describe('fetchCurrentWeather', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns empty snapshot when OPENWEATHER_API_KEY is missing', async () => {
    const result = await fetchCurrentWeather(30, 70);
    expect(result).toEqual(emptySnapshot());
  });

  it('returns empty snapshot on fetch failure', async () => {
    process.env.OPENWEATHER_API_KEY = 'fake-key';
    const result = await fetchCurrentWeather(30, 70);
    expect(result.condition).toBeNull();
  });
});
