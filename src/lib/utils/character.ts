import type { Point } from '../types';
import { DamageType } from '../types';

/** Options for creating a character. */
type CharacterOptions = {
  /** The origin point of the character. */
  origin: Point;
};

/** A record of damage taken by a character. */
type DamageEntry = {
  /** The amount of damage taken. */
  damageValue: number;
  /** The type of damage taken. */
  damageType: DamageType;
  /** The amount of armor piercing of the instance of damage. */
  armorPiercing: number;
};

/** Details of total damage taken by a character from the effects of combined explosions */
export type CharacterDamageDetails = {
  /** The total damage taken by the character, by type */
  total: Record<DamageType, number>;
  /** The total armor piercing of the combined explosion effect */
  armorPiercing: number;
  /** The breakdown of damage taken by the character, by explosion */
  breakdown: {
    /** The unique identifier of the explosion. */
    explosionId: string;
    /** The amount of damage taken by the character from the explosion, for all reflections */
    damageValue: number;
    /** The type of damage taken by the character from the explosion. */
    damageType: DamageType;
    /** The amount of armor piercing of the explosion. */
    armorPiercing: number;
    /**
     * Whether this is the explosion that dealt the highest damage to the character.
     * This is useful as only the highest-damage explosion deals full damage and others
     * contribute half damage.
     */
    isHighestDamage: boolean;
    /**
     * Whether this is the explosion that had the best armor piercing.
     * This is useful as the best armor piercing is used as the base for combined AP, with
     * further explosions improving armor piercing by 1.
     */
    isBestArmorPiercing: boolean;
  }[];
};

/** A character capable of taking damage from explosions. */
export class Character {
  /** The unique identifier of the character. */
  private _id: string = crypto.randomUUID();
  /** The origin point of the character. */
  private _origin: Point;
  /** The record of damage taken by the character. */
  private _damageTaken: Record<string, DamageEntry[]> = {};

  /**
   * Creates a new character.
   * @param options - The options for creating the character.
   * @param options.origin - The origin point of the character.
   */
  constructor(options: CharacterOptions) {
    this._origin = options.origin;
  }

  /**
   * Deeply clones the character, with new ID.
   * @returns A new character with the same options and a new id.
   */
  clone(): Character {
    const clone = new Character({
      origin: this._origin
    });
    clone._damageTaken = structuredClone(this._damageTaken);
    return clone;
  }

  /** Resets the character's damage taken. */
  resetDamageTaken() {
    this._damageTaken = {};
  }

  /**
   * Adds damage taken by the character from an explosion.
   * @param explosionId - The unique identifier of the explosion.
   * @param damageEntry - The damage entry to add.
   * @param damageEntry.damageValue - The amount of damage taken by the character from the explosion.
   * @param damageEntry.damageType - The type of damage taken by the character from the explosion.
   * @param damageEntry.armorPiercing - The amount of armor piercing of the instance of damage.
   */
  addDamage(explosionId: string, damageEntry: DamageEntry) {
    if (!(explosionId in this._damageTaken)) {
      this._damageTaken[explosionId] = [];
    }
    this._damageTaken[explosionId].push(damageEntry);
  }

  // GETTERS
  /** The unique identifier of the character. */
  get id(): string {
    return this._id;
  }

  /** The origin point of the character. */
  get origin(): Point {
    return this._origin;
  }

  /**
   * The detailed breakdown of taken damage from all explosions.
   * @returns The detailed breakdown of taken damage from all explosions, by explosion.
   *     Also flags the highest-damage and best-armor piercing explosions. Only the
   *     highest-damage explosion deals full damage and others contribute half damage.
   *     The best-armor piercing explosion is used as the base for combined AP, with
   *     further explosions improving armor piercing by 1.
   */
  get combinedDamageDetails(): CharacterDamageDetails {
    const perExplosionDetails: Record<
      string,
      DamageEntry & { explosionId: string }
    > = {};
    const total: Record<DamageType, number> = {
      [DamageType.PHYSICAL]: 0,
      [DamageType.STUN]: 0
    };
    let bestArmorPiercingIndex = -1;

    for (const [explosionId, damageEntries] of Object.entries(
      this._damageTaken
    )) {
      for (const damageEntry of damageEntries) {
        const details = (perExplosionDetails[explosionId] ??= {
          explosionId,
          damageValue: 0,
          damageType: damageEntry.damageType,
          armorPiercing: damageEntry.armorPiercing
        });
        details.damageValue += damageEntry.damageValue;
      }
    }

    const sortedExplosions = Object.values(perExplosionDetails).sort(
      (a, b) => b.damageValue - a.damageValue
    );

    for (let i = 0; i < sortedExplosions.length; i++) {
      const explosion = sortedExplosions[i];
      total[explosion.damageType] += explosion.damageValue / (i === 0 ? 1 : 2);

      if (
        bestArmorPiercingIndex === -1 ||
        explosion.armorPiercing <
          sortedExplosions[bestArmorPiercingIndex].armorPiercing
      ) {
        bestArmorPiercingIndex = i;
      }
    }

    return {
      total,
      armorPiercing:
        bestArmorPiercingIndex === -1
          ? 0
          : sortedExplosions[bestArmorPiercingIndex].armorPiercing -
            (sortedExplosions.length - 1),
      breakdown: sortedExplosions.map((explosion, i) => ({
        ...explosion,
        isHighestDamage: i === 0,
        isBestArmorPiercing: i === bestArmorPiercingIndex
      }))
    };
  }
}
