import { describe, expect, test } from 'vitest';

import { reflect } from '../src/lib/utils/math';

describe('reflect', () => {
  test('should return deep copy of original point', () => {
    const p = { x: 0, y: 0 };
    expect(reflect(p, { x: -1, y: 0 }, { x: 1, y: 0 })).toEqual(p);
    expect(reflect(p, { x: -1, y: 0 }, { x: 1, y: 0 })).not.toBe(p);
  });
  test('should return original point when point is on the line', () => {
    const p = { x: 0, y: 0 };
    expect(reflect(p, { x: -1, y: 0 }, { x: 1, y: 0 })).toEqual(p);
  });
  test('should return original point when line is defined by the same point', () => {
    const p = { x: 0, y: 0 };
    expect(reflect(p, { x: 1, y: 0 }, { x: 1, y: 0 })).toEqual(p);
  });
  test('should reflect point across x-axis aligned line', () => {
    const p = { x: 0, y: -1 };
    const expected = { x: 0, y: 1 };
    expect(reflect(p, { x: -1, y: 0 }, { x: 1, y: 0 })).toEqual(expected);
  });
  test('should reflect point across y-axis aligned line', () => {
    const p = { x: -1, y: 0 };
    const expected = { x: 1, y: 0 };
    expect(reflect(p, { x: 0, y: -1 }, { x: 0, y: 1 })).toEqual(expected);
  });
  test('should reflect point across line with positive slope', () => {
    const p = { x: -1, y: 1 };
    const expected = { x: 1, y: -1 };
    expect(reflect(p, { x: -1, y: -1 }, { x: 1, y: 1 })).toEqual(expected);
  });
  test('should reflect point across line with negative slope', () => {
    const p = { x: 1, y: 1 };
    const expected = { x: -1, y: -1 };
    expect(reflect(p, { x: -1, y: 1 }, { x: 1, y: -1 })).toEqual(expected);
  });
  test('should reflect the point to the same location regardless of order of line-defining points', () => {
    const p = { x: 0, y: -1 };
    const a = { x: -1, y: 0 };
    const b = { x: 1, y: 0 };
    expect(reflect(p, a, b)).toEqual(reflect(p, b, a));
  });
});
