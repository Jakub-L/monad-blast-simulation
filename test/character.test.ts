import { describe, expect, test } from 'vitest';

import { DamageType } from '@/types';
import { Character } from '@/utils/character';

describe('Character', () => {
  const origin = { x: 2, y: -3 };

  test('should expose its id and origin', () => {
    const character = new Character({ origin });

    expect(character.id).toEqual(expect.any(String));
    expect(character.origin).toBe(origin);
  });

  test('should clone its damage state with a new id', () => {
    const character = new Character({ origin });
    character.addDamage('explosion-1', {
      damageValue: 20,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 3
    });

    const clone = character.clone();

    expect(clone).not.toBe(character);
    expect(clone.id).not.toBe(character.id);
    expect(clone.origin).toBe(character.origin);
    expect(clone.combinedDamageDetails).toEqual(
      character.combinedDamageDetails
    );

    character.addDamage('explosion-1', {
      damageValue: 10,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 3
    });
    expect(clone.combinedDamageDetails).not.toEqual(
      character.combinedDamageDetails
    );
  });

  test('should reset damage taken', () => {
    const character = new Character({ origin });
    character.addDamage('explosion-1', {
      damageValue: 20,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 3
    });

    character.resetDamageTaken();

    expect(character.combinedDamageDetails).toEqual({
      total: {
        [DamageType.PHYSICAL]: 0,
        [DamageType.STUN]: 0
      },
      armorPiercing: 0,
      breakdown: []
    });
  });

  test('should combine entries from one explosion', () => {
    const character = new Character({ origin });
    character.addDamage('explosion-1', {
      damageValue: 20,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 3
    });
    character.addDamage('explosion-1', {
      damageValue: 10,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 3
    });

    expect(character.combinedDamageDetails).toEqual({
      total: {
        [DamageType.PHYSICAL]: 30,
        [DamageType.STUN]: 0
      },
      armorPiercing: 3,
      breakdown: [
        {
          explosionId: 'explosion-1',
          damageValue: 30,
          damageType: DamageType.PHYSICAL,
          armorPiercing: 3,
          isHighestDamage: true,
          isBestArmorPiercing: true
        }
      ]
    });
  });

  test('should halve lower-damage explosions and combine their best armor piercing', () => {
    const character = new Character({ origin });
    character.addDamage('explosion-1', {
      damageValue: 20,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 5
    });
    character.addDamage('explosion-2', {
      damageValue: 10,
      damageType: DamageType.STUN,
      armorPiercing: -2
    });
    character.addDamage('explosion-3', {
      damageValue: 6,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 7
    });

    expect(character.combinedDamageDetails).toEqual({
      total: {
        [DamageType.PHYSICAL]: 23,
        [DamageType.STUN]: 5
      },
      armorPiercing: -4,
      breakdown: [
        {
          explosionId: 'explosion-1',
          damageValue: 20,
          damageType: DamageType.PHYSICAL,
          armorPiercing: 5,
          isHighestDamage: true,
          isBestArmorPiercing: false
        },
        {
          explosionId: 'explosion-2',
          damageValue: 10,
          damageType: DamageType.STUN,
          armorPiercing: -2,
          isHighestDamage: false,
          isBestArmorPiercing: true
        },
        {
          explosionId: 'explosion-3',
          damageValue: 6,
          damageType: DamageType.PHYSICAL,
          armorPiercing: 7,
          isHighestDamage: false,
          isBestArmorPiercing: false
        }
      ]
    });
  });

  test('should return zero totals when no explosions dealt damage', () => {
    const character = new Character({ origin });

    expect(character.combinedDamageDetails).toEqual({
      total: {
        [DamageType.PHYSICAL]: 0,
        [DamageType.STUN]: 0
      },
      armorPiercing: 0,
      breakdown: []
    });
  });
});
