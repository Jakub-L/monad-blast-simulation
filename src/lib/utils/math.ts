import type { Point } from '../types';
import { Vector } from './vector';

/**
 * Reflects a point across a line passing through two points.
 * @param p - The point to reflect
 * @param a - The first point on the line
 * @param b - The second point on the line
 * @returns The reflected point
 */
export const reflect = (p: Point, a: Point, b: Point): Point => {
  if (a.x === b.x && a.y === b.y) return { x: p.x, y: p.y };

  const dir = Vector.fromTo(a, b);
  const t = Vector.fromTo(a, p).dot(dir) / dir.dot(dir);
  const closestPoint = dir.scale(t).add(a);
  const { x, y } = closestPoint.scale(2).sub(p);

  return { x, y };
};
