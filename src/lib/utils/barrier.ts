import type { Point } from '@/types';
import type { Explosion } from '@/utils/explosion';
import { Vector } from './vector';

/** Options for creating a barrier. */
type BarrierOptions = {
  /** The start point of the barrier. */
  start: Point;
  /** The end point of the barrier. */
  end: Point;
  /** The structure of the barrier. */
  structure: number;
  /** The armour of the barrier. */
  armour: number;
  /** The sub-segments of the barrier. */
  sections?: BarrierSection[];
};

/** A sub-segment of a barrier with its own condition monitor */
export type BarrierSection = {
  /** The unique identifier of the section. */
  id: string;
  /** The start point of the section. */
  start: Point;
  /** The end point of the section. */
  end: Point;
  /** The midpoint of the section. */
  midpoint: Point;
  /** The remaining structure of the section, its remaining condition monitor boxes. */
  remainingStructure: number;
};

export class Barrier {
  /** The start point of the barrier. */
  private _start: Point;
  /** The end point of the barrier. */
  private _end: Point;
  /** The structure of the barrier. */
  private _structure: number;
  /** The armour of the barrier. */
  private _armour: number;
  /** The sub-segments of the barrier. */
  private _sections: BarrierSection[] = [];

  /**
   * Creates a new barrier.
   * @param options - The options for creating the barrier.
   * @param options.start - The start point of the barrier.
   * @param options.end - The end point of the barrier.
   * @param options.structure - The structure of the barrier.
   * @param options.armour - The armour of the barrier.
   */
  constructor(options: BarrierOptions) {
    this._start = options.start;
    this._end = options.end;
    this._structure = Math.max(0, options.structure);
    this._armour = Math.max(0, options.armour);
    this._sections = options.sections ?? this._getSections();
  }

  /**
   * Creates a clone of the barrier. Each section has a new ID.
   * @returns A clone of the barrier.
   */
  clone(): Barrier {
    return new Barrier({
      start: this._start,
      end: this._end,
      structure: this._structure,
      armour: this._armour,
      sections: this._sections.map(section => ({
        ...section,
        id: crypto.randomUUID()
      }))
    });
  }

  /**
   * Calculates the soak pool for a barrier.
   * The soak pool is the sum of the barrier's structure and armour,
   * modified by the explosion's armor piercing.
   * @param explosion - The explosion to calculate the soak pool for
   * @returns The soak pool for the barrier
   */
  getSoakPool(explosion: Explosion): number {
    return this._structure + this._armour + explosion.armorPiercing;
  }

  /**
   * Calculates the sub-segments of the barrier.
   * Each sub-segment is at most 1 unit long; the last sub-segment might be shorter for
   * non-integer length barriers.
   */
  private _getSections(): BarrierSection[] {
    const sections: BarrierSection[] = [];
    const barrier = Vector.fromTo(this._start, this._end);
    const barrierStart = new Vector(this._start.x, this._start.y);
    const length = barrier.length;
    const unitVector = barrier.normalize();

    for (let traveled = 0; traveled < length; traveled++) {
      const segmentLength = Math.min(1, length - traveled);

      const segmentStart = barrierStart.add(unitVector.scale(traveled));
      const segmentEnd = barrierStart.add(
        unitVector.scale(traveled + segmentLength)
      );
      const segmentMidpoint = segmentStart.add(segmentEnd).scale(0.5);

      sections.push({
        id: crypto.randomUUID(),
        start: segmentStart.toPoint(),
        end: segmentEnd.toPoint(),
        midpoint: segmentMidpoint.toPoint(),
        remainingStructure: this._structure
      });
    }

    return sections;
  }

  // GETTERS
  /** The structure of the barrier. */
  get structure(): number {
    return this._structure;
  }

  /** The armour of the barrier. */
  get armour(): number {
    return this._armour;
  }

  /** The sub-segments of the barrier. */
  get sections(): BarrierSection[] {
    return this._sections;
  }

  /** Whether the barrier is valid. It must have a non-zero length. */
  get isValid(): boolean {
    return Vector.fromTo(this._start, this._end).length > 0;
  }
}
