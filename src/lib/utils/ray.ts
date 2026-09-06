import type { Barrier, BarrierSection } from '@/utils/barrier';
import type { Explosion } from '@/utils/explosion';
import type { Point } from '@/types';

import { cellDistance, intersect, reflect } from '@/utils/math';
import { Character } from '@/utils/character';
import { Vector } from '@/utils/vector';

import { EPSILON } from '@/constants';

/** Options for creating a ray. */
type RayOptions = {
  /** The explosion that created the ray. */
  sourceExplosion: Explosion;
  /**
   * The point from which the ray emanates. This may not be the same as the
   * origin of the source explosion if the ray has bounced off a barrier.
   */
  virtualSource: Point;
  /** The target of the ray. */
  target: RayTarget;
  /** The segments the ray has bounced off. */
  boucedSections?: BarrierSection[];
  /** The distance the ray has travelled. */
  travelledDistance?: number;
};

/** The target of a ray, either a (mid)point of a segment or a character */
export type RayTarget = Point | Character;

/** Details of an intersection between a ray and a barrier segment. */
type IntersectionDetails = {
  /** The barrier that was intersected. */
  barrier: Barrier;
  /** The segment within that barrier that was intersected. */
  segment: BarrierSection;
  /** The distance to the intersection from the source of the ray. */
  distance: number;
};

/**
 * Comparator function for sorting intersection details by distance.
 * Assumes distances below EPSILON are equal for avoiding floating point precision issues.
 * @param a - The first distance.
 * @param b - The second distance.
 * @returns The difference between the two distances.
 */
const compareDistances = (a: number, b: number): number =>
  Math.abs(a - b) > EPSILON ? a - b : 0;

/** A ray of damage from an explosion. */
export class Ray {
  /** The unique identifier of the ray. */
  private _id: string = crypto.randomUUID();
  /** The vector of the ray. */
  private _vector: Vector;
  /** The explosion that created the ray. */
  private _sourceExplosion: Explosion;
  /** The distance the ray has travelled. */
  private _travelledDistance: number;
  /**
   * The effective point from which the ray emanates. This may not be the same as the origin
   * of the source explosion if the ray has bounced off a barrier.
   */
  private _virtualSource: Point;
  /** The segments the ray has bounced off. */
  private _boucedSections: BarrierSection[];
  /** The target of the ray. */
  private _target: RayTarget;

  /**
   * Creates a new ray.
   * @param options - The options for creating the ray.
   * @param options.sourceExplosion - The explosion that created the ray.
   * @param options.virtualSource - The point from which the ray emanates. This may not be the same as the origin of the source explosion if the ray has bounced off a barrier.
   * @param options.target - The target of the ray.
   * @param options.boucedSections - The segments the ray has bounced off.
   * @param options.travelledDistance - The distance the ray has travelled.
   * @returns A new ray.
   */
  constructor(options: RayOptions) {
    this._sourceExplosion = options.sourceExplosion;
    this._virtualSource = options.virtualSource;
    this._boucedSections = options.boucedSections ?? [];
    this._target = options.target;
    this._travelledDistance = cellDistance(
      this._sourceExplosion.origin,
      this.targetPoint
    );
    this._vector = Vector.fromTo(
      this._virtualSource,
      this.targetPoint
    ).normalize();
  }

  /**
   * Unfolds a point through a ray's bounced segments, mapping it from the ray's virtual
   * source frame back into the explosion's cell frame. Reflections preserve distance, so
   * the distance from the unfolded point to the explosion's cell equals the distance from
   * the original point to the cell reflected with the virtual source.
   *
   * @param point - The point to unfold
   * @returns The unfolded point
   */
  fromVirtualSourceFrame(point: Point): Point {
    let unfolded = point;
    for (let i = this._boucedSections.length - 1; i >= 0; i--) {
      const section = this._boucedSections[i];
      unfolded = reflect(unfolded, section.start, section.end);
    }
    return unfolded;
  }

  /**
   * Gets the segments that the ray intersects with.
   * @param barriers - The barriers to check.
   * @returns The segments that the ray intersects with, sorted by distance to intersection.
   */
  getIntersectedSegments(barriers: Barrier[]): IntersectionDetails[] {
    const intersectedSegments: IntersectionDetails[] = [];
    for (const barrier of barriers) {
      for (const segment of barrier.sections ?? []) {
        if (segment.remainingStructure <= 0) continue;
        const intersection = intersect(
          this._virtualSource,
          this._vector,
          segment
        );
        if (intersection === null) continue;
        const damageDistance = cellDistance(
          this._sourceExplosion.origin,
          this.fromVirtualSourceFrame(intersection.point)
        );
        if (this._sourceExplosion.damageAtDistance(damageDistance) > 0) {
          intersectedSegments.push({
            barrier,
            segment,
            distance: intersection.distance
          });
        }
      }
    }

    return intersectedSegments.sort(
      (a, b) =>
        compareDistances(a.distance, b.distance) ||
        a.segment.id.localeCompare(b.segment.id)
    );
  }

  /**
   * Checks if a ray passes through all of its bounced segments and finds the offset along the
   * travelled distance at which the ray intersects the last bounced segment.
   *
   * For example, if the ray has travelled 10 units and this function returns 3, then the
   * distance from the last bounced barrier to the target is 7 units.
   *
   * Works by starting at the target and walking backwards through the bounces.
   *
   * @returns The offset from the source of the ray to the last reflection, or null if the ray
   *     does not pass through any of its bounced segments.
   */
  getReflectionOffset(): number | null {
    let source = this._virtualSource;
    let target = this.targetPoint;
    let offset = 0;

    for (let i = this._boucedSections.length - 1; i >= 0; i--) {
      const segment = this._boucedSections[i];
      const targetVector = Vector.fromTo(source, target);
      const intersection = intersect(source, targetVector.normalize(), segment);
      if (intersection === null) return null;
      // The reflection must happen strictly between the source and the target.
      if (
        intersection.distance <= EPSILON ||
        intersection.distance >= targetVector.length - EPSILON
      )
        return null;
      if (offset === 0) offset = intersection.distance;

      // Mirror the source across the segment and continue with the previous reflection.
      source = reflect(source, segment.start, segment.end);
      target = intersection.point;
    }

    return offset;
  }

  // GETTERS
  /** The unique identifier of the ray. */
  get id(): string {
    return this._id;
  }

  /** The vector of the ray. */
  get vector(): Vector {
    return this._vector;
  }

  /** The explosion that created the ray. */
  get sourceExplosion(): Explosion {
    return this._sourceExplosion;
  }

  /** The point to which the ray is travelling. */
  get targetPoint(): Point {
    return this._target instanceof Character
      ? this._target.origin
      : this._target;
  }

  /** The distance the ray has travelled. */
  get travelledDistance(): number {
    return this._travelledDistance;
  }

  /**
   * The effective point from which the ray emanates. This may not be the same as the origin
   * of the source explosion if the ray has bounced off a barrier.
   */
  get virtualSource(): Point {
    return this._virtualSource;
  }

  /** The segments the ray has bounced off. */
  get boucedSections(): BarrierSection[] {
    return this._boucedSections;
  }

  /** The target of the ray. */
  get target(): RayTarget {
    return this._target;
  }
}
