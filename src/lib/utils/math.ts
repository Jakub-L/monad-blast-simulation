import type { Point, Segment } from '@/types';
import { Vector } from '@/utils/vector';
import { EPSILON } from '@/constants';

/**
 * Finds the intersection of a ray and a segment.
 *
 * We can define the ray as r(t) = E + t*N, where:
 * - E is the source position
 * - N is the ray direction (normalized)
 * - t is the distance along the ray (scalar, must be non-negative since
 *   the ray is pointing in one direction to infinity)
 *
 * And the segment of interest as s(u) = P + u*(Q - P), where:
 * - P is the start point of the segment
 * - Q is the end point of the segment
 * - u is the parameter along the segment (scalar, which runs from 0 [at P] to 1 [at Q])
 *
 * First, we find the cross product of the ray direction and the segment. If it is 0, the angle
 * between them is 0 or 180 degrees, so the ray is parallel to the segment.
 *
 * @param source - The source point of the ray
 * @param direction - The direction of the ray
 * @param segment - The segment to check for intersection
 * @returns The intersection point and its distance from the source, or null if there is no
 * intersection
 */
export const intersect = (
  source: Point,
  direction: Vector,
  segment: Segment
): { point: Point; distance: number } | null => {
  const segmentVector = Vector.fromTo(segment.start, segment.end);
  const denominator = direction.cross(segmentVector);

  if (Math.abs(denominator) < EPSILON) return null;

  const diff = Vector.fromTo(source, segment.start);
  const t = diff.cross(segmentVector) / denominator;
  const s = diff.cross(direction) / denominator;

  // If t is negative, the intersection is behind the source in the direction of the ray.
  if (t < 0) return null;

  // If s is not between 0 and 1, the intersection is not within the segment.
  if (s < 0 || s > 1) return null;

  return {
    point: { x: source.x + t * direction.x, y: source.y + t * direction.y },
    distance: t
  };
};

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
