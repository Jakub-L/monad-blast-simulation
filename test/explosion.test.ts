import { describe, expect, test } from 'vitest';

import { DamageType } from '@/types';
import { Explosion } from '@/utils/explosion';

describe('Explosion', () => {
  const options = {
    origin: { x: 2, y: -3 },
    damageValue: 40,
    damageType: DamageType.PHYSICAL,
    armorPiercing: 2,
    blastDecay: 0,
    blastMaxRadius: 10
  };

  test('should expose its options', () => {
    const explosion = new Explosion(options);
    expect(explosion.origin).toBe(options.origin);
    expect(explosion.damageValue).toBe(options.damageValue);
    expect(explosion.damageType).toBe(options.damageType);
    expect(explosion.armorPiercing).toBe(options.armorPiercing);
    expect(explosion.damageDecay).toBe(options.blastDecay);
    expect(explosion.maxRadius).toBe(options.blastMaxRadius);
  });

  test('should have a unique id', () => {
    const explosionA = new Explosion(options);
    const explosionB = new Explosion(options);
    expect(explosionA.id).not.toBe(explosionB.id);
  });

  test('should clone an explosion with the same options and a new id', () => {
    const explosion = new Explosion(options);
    const clone = explosion.clone();
    expect(clone).not.toBe(explosion);
    expect(clone.id).not.toBe(explosion.id);
    expect(clone.origin).toBe(explosion.origin);
    expect(clone.damageValue).toBe(explosion.damageValue);
    expect(clone.damageType).toBe(explosion.damageType);
    expect(clone.armorPiercing).toBe(explosion.armorPiercing);
    expect(clone.damageDecay).toBe(explosion.damageDecay);
    expect(clone.maxRadius).toBe(explosion.maxRadius);
  });

  test('should deal constant damage within its maximum radius', () => {
    const explosion = new Explosion(options);
    expect(explosion.damageAtDistance(0)).toBe(40);
    expect(explosion.damageAtDistance(10)).toBe(40);
  });

  test('should deal no constant damage beyond its maximum radius', () => {
    const explosion = new Explosion(options);
    expect(explosion.damageAtDistance(10.1)).toBe(0);
  });

  test('should apply decay and clamp damage at zero', () => {
    const explosion = new Explosion({
      ...options,
      blastDecay: -3,
      blastMaxRadius: 100
    });
    expect(explosion.damageAtDistance(0)).toBe(40);
    expect(explosion.damageAtDistance(3)).toBe(31);
    expect(explosion.damageAtDistance(75)).toBe(0);
  });

  test("should step damage for full distance units", () => {
    const explosion = new Explosion({
      ...options,
      blastDecay: -3,
      blastMaxRadius: 100
    });
    expect(explosion.damageAtDistance(0)).toBe(40);
    expect(explosion.damageAtDistance(0.9)).toBe(40);
    expect(explosion.damageAtDistance(1)).toBe(37);
  })
});
