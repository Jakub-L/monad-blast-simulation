import { describe, expect, test } from 'vitest';

import type { Point } from '@/types';
import { DamageType } from '@/types';
import type { ExplosionOptions } from '@/utils/explosion';
import { Barrier, type BarrierSection } from '@/utils/barrier';
import { Character } from '@/utils/character';
import { Explosion } from '@/utils/explosion';
import { Ray } from '@/utils/ray';

const explosion = (overrides: Partial<ExplosionOptions> = {}) =>
  new Explosion({
    origin: { x: 0, y: 0 },
    damageValue: 10,
    damageType: DamageType.PHYSICAL,
    armorPiercing: 0,
    blastDecay: 0,
    blastMaxRadius: 100,
    ...overrides
  });

const section = (
  id: string,
  start: Point,
  end: Point,
  remainingStructure = 1
): BarrierSection => ({
  id,
  start,
  end,
  midpoint: {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  },
  remainingStructure
});

const ray = (options: Partial<ConstructorParameters<typeof Ray>[0]> = {}) =>
  new Ray({
    sourceExplosion: explosion(),
    virtualSource: { x: 0, y: 0 },
    target: { x: 10, y: 0 },
    ...options
  });

describe('Ray', () => {
  test('should expose its options and support character targets', () => {
    const character = new Character({ origin: { x: 3, y: 4 } });
    const bouncedSections = [section('1', { x: -1, y: 0 }, { x: 1, y: 0 })];
    const sourceExplosion = explosion();
    const characterRay = ray({
      sourceExplosion,
      virtualSource: { x: 0, y: 1 },
      target: character,
      boucedSections: bouncedSections
    });

    expect(characterRay.id).toEqual(expect.any(String));
    expect(characterRay.vector.x).toBeCloseTo(1 / Math.sqrt(2));
    expect(characterRay.vector.y).toBeCloseTo(1 / Math.sqrt(2));
    expect(characterRay.sourceExplosion).toBe(sourceExplosion);
    expect(characterRay.targetPoint).toBe(character.origin);
    expect(characterRay.target).toBe(character);
    expect(characterRay.virtualSource).toEqual({ x: 0, y: 1 });
    expect(characterRay.boucedSections).toBe(bouncedSections);
    expect(characterRay.travelledDistance).toBeCloseTo(Math.sqrt(13));
  });

  test('should unfold points through bounced sections', () => {
    const bouncedSections = [
      section('bounce', { x: -1, y: 0 }, { x: 1, y: 0 })
    ];
    const rayWithBounce = ray({ boucedSections: bouncedSections });

    expect(rayWithBounce.fromVirtualSourceFrame({ x: 2, y: -3 })).toEqual({
      x: 2,
      y: 3
    });
    expect(ray().fromVirtualSourceFrame({ x: 2, y: -3 })).toEqual({
      x: 2,
      y: -3
    });
  });

  test('should return active intersected sections in distance and ID order', () => {
    const intersected = [
      section('1', { x: 1, y: -1 }, { x: 1, y: 1 }, 0),
      section('2', { x: 1, y: 1 }, { x: 2, y: 1 }),
      section('3', { x: -1, y: -1 }, { x: -1, y: 1 }),
      section('4', { x: 2, y: 1 }, { x: 2, y: 2 }),
      section('5', { x: 2, y: -2 }, { x: 2, y: -1 }),
      section('6', { x: 7, y: -1 }, { x: 7, y: 1 }),
      section('7', { x: 3, y: -1 }, { x: 3, y: 1 }),
      section('8', { x: 4, y: -1 }, { x: 4, y: 1 }),
      section('9', { x: 4, y: -1 }, { x: 4, y: 1 })
    ];
    const barriers = [
      new Barrier({
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        structure: 1,
        armour: 1,
        sections: intersected
      }),
      { sections: undefined } as unknown as Barrier
    ];
    const result = ray({
      sourceExplosion: explosion({ blastMaxRadius: 5 })
    }).getIntersectedSegments(barriers);

    expect(
      result.map(({ segment, distance }) => [segment.id, distance])
    ).toEqual([
      ['7', 3],
      ['8', 4],
      ['9', 4]
    ]);
    expect(result.every(({ barrier }) => barrier === barriers[0])).toBe(true);
  });

  test('should return null when a bounce is not strictly between source and target', () => {
    const parallel = section('1', { x: 1, y: 1 }, { x: 2, y: 1 });
    const atSource = section('2', { x: -1, y: 0 }, { x: 1, y: 0 });
    const atTarget = section('3', { x: 1, y: 0 }, { x: 3, y: 0 });

    expect(
      ray({
        virtualSource: { x: 0, y: 0 },
        target: { x: 2, y: 0 },
        boucedSections: [parallel]
      }).getReflectionOffset()
    ).toBeNull();
    expect(
      ray({
        virtualSource: { x: 0, y: 0 },
        target: { x: 2, y: 1 },
        boucedSections: [atSource]
      }).getReflectionOffset()
    ).toBeNull();
    expect(
      ray({
        virtualSource: { x: 0, y: -1 },
        target: { x: 2, y: 0 },
        boucedSections: [atTarget]
      }).getReflectionOffset()
    ).toBeNull();
  });

  test('should return the distance to the last valid reflection', () => {
    const previousBounce = section('1', { x: 0, y: 1 }, { x: 2, y: 1 });
    const lastBounce = section('2', { x: 2, y: -1 }, { x: 2, y: 3 });

    expect(
      ray({
        virtualSource: { x: 4, y: 0 },
        target: { x: 0, y: 4 },
        boucedSections: [previousBounce, lastBounce]
      }).getReflectionOffset()
    ).toBeCloseTo(Math.sqrt(8));
    expect(ray().getReflectionOffset()).toBe(0);
  });
});
