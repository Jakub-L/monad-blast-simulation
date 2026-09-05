import { describe, expect, test } from 'vitest';

import { DamageType } from '@/types';
import { Barrier, type BarrierSection } from '@/utils/barrier';
import { Explosion } from '@/utils/explosion';

describe('Barrier', () => {
  test('should clamp structure and armour and create unit sections', () => {
    const barrier = new Barrier({
      start: { x: 0, y: 0 },
      end: { x: 2.5, y: 0 },
      structure: -3,
      armour: -1
    });

    expect(barrier.structure).toBe(0);
    expect(barrier.armour).toBe(0);
    expect(barrier.sections).toHaveLength(3);
    expect(barrier.sections).toEqual([
      {
        id: expect.any(String),
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        midpoint: { x: 0.5, y: 0 },
        remainingStructure: 0
      },
      {
        id: expect.any(String),
        start: { x: 1, y: 0 },
        end: { x: 2, y: 0 },
        midpoint: { x: 1.5, y: 0 },
        remainingStructure: 0
      },
      {
        id: expect.any(String),
        start: { x: 2, y: 0 },
        end: { x: 2.5, y: 0 },
        midpoint: { x: 2.25, y: 0 },
        remainingStructure: 0
      }
    ]);
  });

  test('should use supplied sections', () => {
    const sections: BarrierSection[] = [
      {
        id: 'section-1',
        start: { x: 1, y: 1 },
        end: { x: 2, y: 1 },
        midpoint: { x: 1.5, y: 1 },
        remainingStructure: 4
      }
    ];

    const barrier = new Barrier({
      start: { x: 1, y: 1 },
      end: { x: 2, y: 1 },
      structure: 4,
      armour: 2,
      sections
    });

    expect(barrier.sections).toBe(sections);
  });

  test('should calculate the soak pool', () => {
    const explosion = new Explosion({
      origin: { x: 0, y: 0 },
      damageValue: 10,
      damageType: DamageType.PHYSICAL,
      armorPiercing: -2,
      blastDecay: 0,
      blastMaxRadius: 10
    });
    const barrier = new Barrier({
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      structure: 3,
      armour: 4
    });

    expect(barrier.getSoakPool(explosion)).toBe(5);
  });

  test('should clone sections with new IDs', () => {
    const sections: BarrierSection[] = [
      {
        id: 'section-1',
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        midpoint: { x: 0.5, y: 0 },
        remainingStructure: 3
      }
    ];
    const barrier = new Barrier({
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      structure: 3,
      armour: 4,
      sections
    });

    const clone = barrier.clone();

    expect(clone).not.toBe(barrier);
    expect(clone.structure).toBe(barrier.structure);
    expect(clone.armour).toBe(barrier.armour);
    expect(clone.sections).not.toBe(barrier.sections);
    expect(clone.sections[0]).not.toBe(barrier.sections[0]);
    expect(clone.sections[0]).toMatchObject({
      start: sections[0].start,
      end: sections[0].end,
      midpoint: sections[0].midpoint,
      remainingStructure: sections[0].remainingStructure
    });
    expect(clone.sections[0].id).not.toBe(barrier.sections[0].id);
  });

  test('should be valid when it has non-zero length', () => {
    const barrier = new Barrier({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      structure: 1,
      armour: 1
    });

    expect(barrier.isValid).toBe(true);
  });

  test('should be invalid and have no sections when it has zero length', () => {
    const barrier = new Barrier({
      start: { x: 2, y: 3 },
      end: { x: 2, y: 3 },
      structure: 1,
      armour: 1
    });

    expect(barrier.isValid).toBe(false);
    expect(barrier.sections).toEqual([]);
  });
});
