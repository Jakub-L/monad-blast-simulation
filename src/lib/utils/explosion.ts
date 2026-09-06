import type { DamageType, Point } from '@/types';

/** Options for creating an explosion. */
export type ExplosionOptions = {
  /** The origin point of the explosion. */
  origin: Point;
  /** The amount of damage dealt by the explosion. */
  damageValue: number;
  /** The type of damage dealt by the explosion. */
  damageType: DamageType;
  /** The amount of armor piercing of the explosion. Positive values improve barrier armor. */
  armorPiercing: number;
  /** The change in damage per metre. */
  blastDecay: number;
  /** The maximum distance for explosion effects. */
  blastMaxRadius: number;
};

/** An explosion capable of interacting with barriers and characters. */
export class Explosion {
  /** The unique identifier of the explosion. */
  private _id: string = crypto.randomUUID();
  /** The origin point of the explosion. */
  private _origin: Point;
  /** The amount of damage dealt by the explosion. */
  private _damageValue: number;
  /** The type of damage dealt by the explosion. */
  private _damageType: DamageType;
  /** The amount of armor piercing of the explosion. Positive values improve barrier armor. */
  private _armorPiercing: number;
  /** The change in damage per metre. Zero means damage stays constant. */
  private _blastDecay: number;
  /** The maximum distance for explosion effects. */
  private _blastMaxRadius: number;

  /**
   * Creates a new explosion.
   * @param options - The options for creating the explosion.
   * @param options.origin - The origin point of the explosion.
   * @param options.damageValue - The amount of damage dealt by the explosion.
   * @param options.damageType - The type of damage dealt by the explosion.
   * @param options.armorPiercing - The amount of armor piercing of the explosion. Positive values improve barrier armor.
   * @param options.blastDecay - The change in damage per metre. Zero means damage stays constant.
   * @param options.blastMaxRadius - The maximum distance for explosion effects.
   */
  constructor(options: ExplosionOptions) {
    this._origin = options.origin;
    this._damageValue = options.damageValue;
    this._damageType = options.damageType;
    this._armorPiercing = options.armorPiercing;
    this._blastDecay = options.blastDecay;
    this._blastMaxRadius = options.blastMaxRadius;
  }

  /**
   * Deeply clones the explosion, with new ID.
   * @returns A new explosion with the same options and a new id.
   */
  clone(): Explosion {
    return new Explosion({
      origin: this._origin,
      damageValue: this._damageValue,
      damageType: this._damageType,
      armorPiercing: this._armorPiercing,
      blastDecay: this._blastDecay,
      blastMaxRadius: this._blastMaxRadius
    });
  }

  /**
   * Calculates the damage dealt by the explosion at a given distance.
   *
   * @param distance - The distance from the explosion origin.
   * @returns The amount of damage dealt at the given distance.
   */
  damageAtDistance(distance: number): number {
    if (this._blastDecay === 0) {
      if (distance > this._blastMaxRadius) return 0;
      return this._damageValue;
    }
    return Math.max(
      0,
      this._damageValue + this._blastDecay * Math.floor(distance)
    );
  }

  // GETTERS
  /** The unique identifier of the explosion. */
  get id(): string {
    return this._id;
  }

  /** The origin point of the explosion. */
  get origin(): Point {
    return this._origin;
  }

  /** The amount of damage dealt by the explosion. */
  get damageValue(): number {
    return this._damageValue;
  }

  /** The type of damage dealt by the explosion. */
  get damageType(): DamageType {
    return this._damageType;
  }

  /** The amount of armor piercing of the explosion. Positive values improve barrier armor. */
  get armorPiercing(): number {
    return this._armorPiercing;
  }

  /** The change in damage per metre. Zero means damage stays constant. */
  get damageDecay(): number {
    return this._blastDecay;
  }

  /** The maximum distance for explosion effects. */
  get maxRadius(): number {
    return this._blastMaxRadius;
  }

  /** Whether the explosion is valid. It must deal at least 1 damage and have a non-positive blast decay (this would mean damage increases with distance and give the blast infinite range) */
  get isValid(): boolean {
    return this._damageValue >= 1 && this._blastDecay <= 0;
  }
}
