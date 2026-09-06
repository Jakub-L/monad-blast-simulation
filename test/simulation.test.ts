import { afterEach, describe, expect, test, vi } from 'vitest';

import { DamageType } from '@/types';
import { Barrier, type BarrierSection } from '@/utils/barrier';
import { Character } from '@/utils/character';
import { Explosion, type ExplosionOptions } from '@/utils/explosion';
import { Ray } from '@/utils/ray';
import { RayQueue } from '@/utils/ray-queue';
import { Simulation } from '@/simulation';

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

const barrier = (x: number, structure: number, sections?: BarrierSection[]) =>
  new Barrier({
    start: { x, y: -1 },
    end: { x, y: 1 },
    structure,
    armour: 0,
    sections
  });

const remainingStructure = (simulation: Simulation, index = 0) =>
  (simulation as unknown as { _barriers: Barrier[] })._barriers[index]
    .sections[0].remainingStructure;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Simulation', () => {
  test('clones inputs, filters invalid objects, and resets character damage', () => {
    const sourceCharacter = new Character({ origin: { x: 0, y: 0 } });
    sourceCharacter.addDamage('old-explosion', {
      damageValue: 5,
      damageType: DamageType.PHYSICAL,
      armorPiercing: 0
    });
    const simulation = new Simulation({
      barriers: [
        new Barrier({
          start: { x: 0, y: 0 },
          end: { x: 0, y: 0 },
          structure: 1,
          armour: 0
        })
      ],
      explosions: [explosion({ damageValue: 0 }), explosion()],
      characters: [sourceCharacter]
    });

    expect(simulation.characters[0]).not.toBe(sourceCharacter);
    expect(
      (simulation as unknown as { _barriers: Barrier[] })._barriers
    ).toHaveLength(0);

    simulation.simulate();

    expect(simulation.characters[0].combinedDamageDetails.total).toEqual({
      [DamageType.PHYSICAL]: 10,
      [DamageType.STUN]: 0
    });
  });

  test('damages characters and destroys a physical barrier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const simulation = new Simulation({
      barriers: [barrier(2, 10)],
      explosions: [explosion()],
      characters: [new Character({ origin: { x: 1, y: 0 } })]
    });

    simulation.simulate();

    expect(remainingStructure(simulation)).toBe(0);
    expect(simulation.characters[0].combinedDamageDetails.total).toEqual({
      [DamageType.PHYSICAL]: 10,
      [DamageType.STUN]: 0
    });
  });

  test('does not damage a barrier through another intact barrier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const simulation = new Simulation({
      barriers: [barrier(2, 100), barrier(5, 100)],
      explosions: [explosion()],
      characters: []
    });

    simulation.simulate();

    expect(remainingStructure(simulation, 0)).toBe(90);
    expect(remainingStructure(simulation, 1)).toBe(100);
  });

  test('reflects physical damage around an intact barrier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const simulation = new Simulation({
      barriers: [barrier(2, 100)],
      explosions: [explosion()],
      characters: [new Character({ origin: { x: 1, y: 0 } })]
    });

    simulation.simulate();

    expect(remainingStructure(simulation)).toBe(90);
    expect(simulation.characters[0].combinedDamageDetails.total).toEqual({
      [DamageType.PHYSICAL]: 20,
      [DamageType.STUN]: 0
    });
  });

  test('only damages a segment once when targets share a midpoint', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const midpoint = { x: 2, y: 0 };
    const sections = [
      {
        id: 'first',
        start: { x: 2, y: -1 },
        end: { x: 2, y: 1 },
        midpoint,
        remainingStructure: 100
      },
      {
        id: 'second',
        start: { x: 2, y: -1 },
        end: { x: 2, y: 1 },
        midpoint,
        remainingStructure: 0
      }
    ] satisfies BarrierSection[];
    const simulation = new Simulation({
      barriers: [barrier(2, 100, sections)],
      explosions: [explosion()],
      characters: []
    });

    simulation.simulate();

    const clonedSections = (simulation as unknown as { _barriers: Barrier[] })
      ._barriers[0].sections;
    expect(clonedSections[0].remainingStructure).toBe(90);
    expect(clonedSections[1].remainingStructure).toBe(0);
  });

  test('skips a segment destroyed by an earlier ray', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const midpoint = { x: 2, y: 0 };
    const sections = [
      {
        id: 'first',
        start: { x: 2, y: -1 },
        end: { x: 2, y: 1 },
        midpoint,
        remainingStructure: 10
      },
      {
        id: 'second',
        start: { x: 2, y: -1 },
        end: { x: 2, y: 1 },
        midpoint,
        remainingStructure: 0
      }
    ] satisfies BarrierSection[];
    const simulation = new Simulation({
      barriers: [barrier(2, 100, sections)],
      explosions: [explosion()],
      characters: []
    });

    simulation.simulate();

    expect(remainingStructure(simulation)).toBe(0);
  });

  test('ignores stun damage on barriers', () => {
    const simulation = new Simulation({
      barriers: [barrier(2, 1)],
      explosions: [
        explosion({
          damageType: DamageType.STUN
        })
      ],
      characters: []
    });

    simulation.simulate();

    expect(remainingStructure(simulation)).toBe(1);
  });

  test('skips targets outside a constant-damage explosion radius', () => {
    const character = new Character({ origin: { x: 2, y: 0 } });
    const simulation = new Simulation({
      barriers: [],
      explosions: [explosion({ blastMaxRadius: 0 })],
      characters: [character]
    });

    simulation.simulate();

    expect(simulation.characters[0].combinedDamageDetails.breakdown).toEqual(
      []
    );
  });

  test('handles an empty ray returned from a non-empty queue', () => {
    vi.spyOn(RayQueue.prototype, 'pop').mockReturnValueOnce(null);
    const simulation = new Simulation({
      barriers: [],
      explosions: [explosion()],
      characters: [new Character({ origin: { x: 0, y: 0 } })]
    });

    simulation.simulate();

    expect(simulation.characters[0].combinedDamageDetails.breakdown).toEqual(
      []
    );
  });

  test('skips a ray without a valid reflection path', () => {
    vi.spyOn(Ray.prototype, 'getReflectionOffset').mockReturnValue(null);
    const simulation = new Simulation({
      barriers: [],
      explosions: [explosion()],
      characters: [new Character({ origin: { x: 0, y: 0 } })]
    });

    simulation.simulate();

    expect(simulation.characters[0].combinedDamageDetails.breakdown).toEqual(
      []
    );
  });

  test('includes previous bounced sections in reflection keys', () => {
    const previousSection: BarrierSection = {
      id: 'previous',
      start: { x: 0, y: -1 },
      end: { x: 0, y: 1 },
      midpoint: { x: 0, y: 0 },
      remainingStructure: 1
    };
    const parentRay = new Ray({
      sourceExplosion: explosion(),
      virtualSource: { x: 4, y: 0 },
      target: { x: 1, y: 0 },
      boucedSections: [previousSection]
    });
    const simulation = new Simulation({
      barriers: [],
      explosions: [],
      characters: []
    });
    const spawnReflectedRays = (
      simulation as unknown as {
        _spawnReflectedRays: (
          parentRay: Ray,
          segment: BarrierSection,
          spawnedReflections: Set<string>
        ) => Ray[];
      }
    )._spawnReflectedRays;

    expect(
      spawnReflectedRays.call(
        simulation,
        parentRay,
        {
          id: 'new',
          start: { x: 2, y: -1 },
          end: { x: 2, y: 1 },
          midpoint: { x: 2, y: 0 },
          remainingStructure: 1
        },
        new Set()
      )
    ).toEqual([]);
  });
});
