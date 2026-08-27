import { describe, it, expect } from 'vitest';
import { computeFarmHealth } from '@/lib/farms/health';

describe('computeFarmHealth', () => {
  it('returns watch for empty records', () => {
    expect(computeFarmHealth({}, [])).toBe('watch');
  });

  it('returns good when irrigation present', () => {
    expect(computeFarmHealth({}, [{ type: 'irrigation', event_date: '2024-06-01' }])).toBe('good');
  });

  it('returns watch when disease present', () => {
    expect(computeFarmHealth({}, [{ type: 'disease', event_date: '2024-06-01' }])).toBe('watch');
  });

  it('returns good for harvest', () => {
    expect(computeFarmHealth({}, [{ type: 'harvest', event_date: '2024-06-01' }])).toBe('good');
  });
});
