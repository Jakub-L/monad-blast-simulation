import { describe, expect, test, vi } from 'vitest';

import { getTestHits } from '../src/lib/utils/dice';

describe('getTestHits', () => {
  test('should return 0 for a pool of 0', () => {
    expect(getTestHits(0)).toBe(0);
  });
  test('should return 0 for a negative pool', () => {
    expect(getTestHits(-1)).toBe(0);
  });
  test('should count 1-4 as misses', () => {
    expect(getTestHits(1, () => 1)).toBe(0);
    expect(getTestHits(1, () => 2)).toBe(0);
    expect(getTestHits(1, () => 3)).toBe(0);
    expect(getTestHits(1, () => 4)).toBe(0);
  });
  test('should count 5-6 as hits', () => {
    expect(getTestHits(1, () => 5)).toBe(1);
    expect(getTestHits(1, () => 6)).toBe(1);
  });
  test('should correctly count hits in a pool of mixed results', () => {
    const roller = () => {
      let count = 0;
      return vi.fn(() => ++count);
    };
    expect(getTestHits(6, roller())).toBe(2);
  });
});
