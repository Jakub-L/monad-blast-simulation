import type { Barrier } from '@/utils/barrier';
import type { BarrierSection } from '@/utils/barrier';
import type { Character } from '@/utils/character';
import type { Explosion } from '@/utils/explosion';
import type { Point } from '@/types';
import type { RayTarget } from '@/utils/ray';
import { DamageType } from '@/types';

import { getTestHits } from '@/utils/dice';
import { reflect } from '@/utils/math';
import { Ray } from '@/utils/ray';
import { RayQueue } from '@/utils/ray-queue';
import { Vector } from '@/utils/vector';

import { EPSILON } from '@/constants';

/**
 * Utility function to get the set of affected elements from the deeply nested Maps of
 * affected elements. Always returns a set, creating the necessary nested structures if they
 * don't exist.
 *
 * @param affectedElements - The Map to check.
 * @param explosion - The explosion to get the set for.
 * @param reflection - The reflection count to get the set for. Zero indicates the direct
 *     effect, 1 is the first reflection, etc.
 * @returns The set of affected elements.
 */
const getAffectedSet = <E>(
  affectedElements: Map<Explosion, Set<E>[]>,
  explosion: Explosion,
  reflection: number
): Set<E> => {
  if (!affectedElements.has(explosion)) affectedElements.set(explosion, []);
  const affectedByExplosion = affectedElements.get(explosion)!;
  if (affectedByExplosion[reflection]) return affectedByExplosion[reflection];
  affectedByExplosion[reflection] = new Set<E>();
  return affectedByExplosion[reflection];
};

/**
 * Gets a unique key for a ray and a potential target.
 *
 * Concatenates the explosion ID, the IDs of the segments the ray has bounced off, and
 * the ID of the target.
 *
 * @param ray - The ray to get the key for.
 * @param targetId - The ID of the target to get the key for.
 * @returns A unique key for the ray and target.
 */
const getReflectionKey = (ray: Ray, targetId: string): string => {
  return [
    ray.sourceExplosion.id,
    ...ray.boucedSections.map(({ id }: BarrierSection) => id),
    targetId
  ].join('-');
};

/** Options for creating a simulation. */
type SimulationOptions = {
  /** The barriers in the simulation. */
  barriers: Barrier[];
  /** The explosions in the simulation. */
  explosions: Explosion[];
  /** The characters in the simulation. */
  characters: Character[];
};

/** A Shadowrun 5E simulation of explosions */
export class Simulation {
  /** The barriers in the simulation. */
  private _barriers: Barrier[];
  /** The explosions in the simulation. */
  private _explosions: Explosion[];
  /** The characters in the simulation. */
  private _characters: Character[];

  /**
   * Creates a new simulation. Creates clones of the barriers, explosions, and characters
   * to avoid mutating the original objects. Filters out invalid barriers and explosions.
   *
   * @param options - The options for creating the simulation.
   * @param options.barriers - The barriers in the simulation.
   * @param options.explosions - The explosions in the simulation.
   * @param options.characters - The characters in the simulation.
   */
  constructor({ barriers, explosions, characters }: SimulationOptions) {
    this._barriers = barriers
      .map(barrier => barrier.clone())
      .filter(barrier => barrier.isValid);
    this._explosions = explosions
      .map(explosion => explosion.clone())
      .filter(explosion => explosion.isValid);
    this._characters = characters.map(character => character.clone());
  }

  simulate() {
    for (const character of this._characters) {
      character.resetDamageTaken();
    }

    const queue = new RayQueue(this._getInitialRays());
    const spawnedReflections = new Set<string>();

    // Maps explosions to arrays of sets of affected segments or characters.
    // Each Map is keyed by the explosion and its value is an array. Each of the array's
    // indices corresponds to a particular reflection. For example Map[id-1][0] is the set
    // of affected elements that are directly affected by explosion id-1. Map[id-1][1] is the
    // set of affected elements that are affected by explosion id-1 after one reflection, etc.
    const affectedSegments = new Map<Explosion, Set<BarrierSection>[]>();
    const affectedCharacters = new Map<Explosion, Set<Character>[]>();

    while (!queue.isEmpty) {
      const ray = queue.pop();
      if (!ray) break;

      const startOffset = ray.getReflectionOffset();
      if (startOffset === null) continue;

      const blastDamage = ray.sourceExplosion.damageAtDistance(
        ray.travelledDistance
      );
      if (blastDamage <= 0) continue;

      const reflectionCount = ray.boucedSections.length;
      const targetSegment = this._getTargetSegment(ray.targetPoint);

      // Check if the ray's path is blocked by a different segment than the target.
      let isPathBlocked = false;
      const rayPathDistance = Vector.fromTo(
        ray.virtualSource,
        ray.targetPoint
      ).length;
      const intersectedSegments = ray.getIntersectedSegments(this._barriers);
      for (const { segment, distance } of intersectedSegments) {
        // The ray has already passed through this segment.
        if (distance <= startOffset + EPSILON) continue;
        // The segment is beyond the target
        if (distance > rayPathDistance + EPSILON) break;
        // The segment is the target
        if (segment === targetSegment?.segment) break;
        // Otherwise the segment is a different segment that blocks the ray
        isPathBlocked = true;
        break;
      }
      if (isPathBlocked) continue;

      // The target is a segment
      if (targetSegment) {
        const { barrier, segment } = targetSegment;
        // The segment is already destroyed
        if (segment.remainingStructure <= 0) continue;
        // Stun damage is ignored and not reflected off of segments.
        if (ray.sourceExplosion.damageType === DamageType.STUN) continue;

        const segmentsAffectedByReflection = getAffectedSet(
          affectedSegments,
          ray.sourceExplosion,
          reflectionCount
        );

        // A given segment can only be damaged by the explosion once per reflection.
        if (!segmentsAffectedByReflection.has(segment)) {
          segmentsAffectedByReflection.add(segment);
          const hits = getTestHits(barrier.getSoakPool(ray.sourceExplosion));
          segment.remainingStructure -= Math.max(0, blastDamage - hits);
        }

        // If the segment is still intact, spawn their reflections and add them to the queue.
        if (segment.remainingStructure > 0) {
          const reflectedRays = this._spawnReflectedRays(
            ray,
            segment,
            spawnedReflections
          );
          for (const reflectedRay of reflectedRays) queue.add(reflectedRay);
        }
        continue;
      }

      // The target is a character
      const character = ray.target as Character;
      const affectedCharactersAtDepth = getAffectedSet(
        affectedCharacters,
        ray.sourceExplosion,
        reflectionCount
      );
      // A given character can only be damaged by the explosion once per reflection.
      if (!affectedCharactersAtDepth.has(character)) {
        affectedCharactersAtDepth.add(character);
        character.addDamage(ray.sourceExplosion.id, {
          damageType: ray.sourceExplosion.damageType,
          armorPiercing: ray.sourceExplosion.armorPiercing,
          damageValue: blastDamage
        });
      }
    }
  }

  /**
   * Gets the initial rays to consider for the simulation. Assumes a ray fired from every
   * explosion towards every target (every barrier segment midpoint and every character).
   * @returns The rays for all explosions.
   */
  private _getInitialRays(): Ray[] {
    const targets = this._getTargets();
    return this._explosions.flatMap(explosion =>
      targets.map(
        target =>
          new Ray({
            sourceExplosion: explosion,
            virtualSource: explosion.origin,
            target
          })
      )
    );
  }

  /**
   * Gets the targets of the rays - midpoints of all segments of all barriers, and
   * all characters.
   *
   * @returns The targets of the rays.
   */
  private _getTargets(): RayTarget[] {
    const segmentMidpoints = this._barriers.flatMap(({ sections }) =>
      sections.map(({ midpoint }) => midpoint)
    );
    return [...segmentMidpoints, ...this._characters];
  }

  /**
   * Given a target point, finds the segment and barrier that the target is on.
   * @param target - The target to get the segment and barrier for.
   * @returns The segment and barrier that the target is on, or null if the target is not on any segment.
   */
  private _getTargetSegment(
    target: Point
  ): { barrier: Barrier; segment: BarrierSection } | null {
    for (const barrier of this._barriers) {
      for (const segment of barrier.sections) {
        if (segment.midpoint === target) return { barrier, segment };
      }
    }
    return null;
  }

  /**
   * Spawns the reflected rays by bouncing a parent ray off of a segment. Reflects the source of
   * the ray in the provided segment, then spawns new rays for each possible target.
   *
   * @param parentRay - The ray that has bounced off a segment.
   * @param segment - The segment that the ray has bounced off.
   * @param spawnedReflections - The set of reflection keys for the rays that have already been
   *     spawned.
   * @returns The new rays.
   */
  private _spawnReflectedRays(
    parentRay: Ray,
    segment: BarrierSection,
    spawnedReflections: Set<string>
  ): Ray[] {
    const reflectedRays: Ray[] = [];
    const reflectionKey = getReflectionKey(parentRay, segment.id);

    // Avoid spawning duplicate rays. Each ray-path-target combination should
    // only be considered once.
    if (spawnedReflections.has(reflectionKey)) return reflectedRays;
    spawnedReflections.add(reflectionKey);

    const reflectedSource = reflect(
      parentRay.virtualSource,
      segment.start,
      segment.end
    );

    for (const target of this._getTargets()) {
      const reflectedRay = new Ray({
        sourceExplosion: parentRay.sourceExplosion,
        virtualSource: reflectedSource,
        target: target,
        boucedSections: [...parentRay.boucedSections, segment]
      });

      // Check if the new ray would pass through all of the segments its parent ray has
      // already bounced off. This excludes physically-impossible rays.
      if (reflectedRay.getReflectionOffset() !== null)
        reflectedRays.push(reflectedRay);
    }
    return reflectedRays;
  }

  // GETTERS
  /** The characters in the simulation. */
  get characters(): Character[] {
    return this._characters;
  }
}
