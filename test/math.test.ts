import { describe, expect, test } from 'vitest';

import { intersect, reflect } from '@/utils/math';
import { Vector } from '@/utils/vector';

describe('intersect', () => {
  const source = { x: 0, y: 0 };
  const direction = new Vector(1, 0);

  test('should return the intersection point and distance', () => {
    expect(
      intersect(source, direction, {
        start: { x: 2, y: -1 },
        end: { x: 2, y: 1 }
      })
    ).toEqual({
      point: { x: 2, y: 0 },
      distance: 2
    });
  });
  test('should return null for a ray parallel to the segment', () => {
    expect(
      intersect(source, direction, {
        start: { x: 1, y: 1 },
        end: { x: 2, y: 1 }
      })
    ).toBeNull();
  });
  test('should return null when the intersection is behind the source', () => {
    expect(
      intersect(source, direction, {
        start: { x: -2, y: -1 },
        end: { x: -2, y: 1 }
      })
    ).toBeNull();
  });
  test('should return null when the intersection is before the segment start', () => {
    expect(
      intersect(source, direction, {
        start: { x: 2, y: 1 },
        end: { x: 2, y: 2 }
      })
    ).toBeNull();
  });
  test('should return null when the intersection is after the segment end', () => {
    expect(
      intersect(source, direction, {
        start: { x: 2, y: -2 },
        end: { x: 2, y: -1 }
      })
    ).toBeNull();
  });
});

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
