# Monad//Blast Simulation Library

This is a modified version of the library underpinning [Monad//Blast](https://monad-blast.fatman.dev), with the browswer-specific code removed. This code is licensed under the [GPL-3.0](LICENSE) license.

The simulation uses the image-source method. In general, the process is as follows:
1. For each explosion create a ray to each possible target - this includes barriers and characters.
2. If the ray hits a character, it records the damage taken by the character.
3. If the ray hits a barrier and the barrier survives the blast, it creates a virtual explosion, by reflecting the original explosion in the barrier.
4. It then regenerates rays from this new virtual explosion to all possible targets, trimming impossible rays.
5. Repeat steps 2-4 until all rays have travelled far enough for their damage to be reduced to zero.

## Usage

This library exposes the most useful classes in its `index.ts` file:

- `Character`: A character capable of taking damage from explosions. They do not interact with explosions or barriers directly, beyond taking damage from them. They do not stop propagation or affect the simulation. Essentially a sampling point.
- `Explosion`: An explosion capable of damaging characters and barriers. They can deal stun or physical damage and have fixed (e.g. "10 metres") or decaying (e.g. "-1/metre") radii.
- `Barrier`: A barrier capable of reflecting explosions.
- `Simulation`: The simulation class. Takes characters, barriers and explosions as input and runs the simulation with the `.simulate()` method.
- `DamageType`: An enum for stun and physical damage. Exposed as it is used in instantiating the `Explosion` class.

Additional, deeper utility classes and functions can be accessed from the `lib` directory, but generally shouldn't be needed for most use cases.

```ts
// An example simulation based on the Shadowrun Core Rulebook's example
// (although that example uses a cylinder - the simulation does not
// support rounded barriers)

// Devil rat
const characters = [new Character({ origin: { x: 0, y: 0 } })];

// 2-by-2 concrete square sewer
const barriers = [
 new Barrier({ start: { x: -1, y: -1 }, end: { x: -1, y: 1 }, structure: 12, armour: 20 }),
 new Barrier({ start: { x: -1, y: 1 }, end: { x: 1, y: 1 }, structure: 12, armour: 20 }),
 new Barrier({ start: { x: 1, y: 1 }, end: { x: 1, y: -1 }, structure: 12, armour: 20 }),
 new Barrier({ start: { x: 1, y: -1 }, end: { x: -1, y: -1 }, structure: 12, armour: 20 })
];

// Two frag grenades.
// Explosions and characters can share grid cells.
// For decaying blasts, blastMaxRadius should be set high enough to prevent accidental clipping.
const explosions = [
  new Explosion({
    origin: { x: 0, y: 0 },
    damageValue: 18,
    damageType: DamageType.PHYSICAL,
    armorPiercing: 5,
    blastDecay: -1,
    blastMaxRadius: 1e6
  }),
  new Explosion({
    origin: { x: 0, y: 0 },
    damageValue: 18,
    damageType: DamageType.PHYSICAL,
    armorPiercing: 5,
    blastDecay: -1,
    blastMaxRadius: 1e6
  })
];

// Instantiate and run the simulation
const simulation = new Simulation(characters, barriers, explosions);
simulation.simulate();

// To view the damage details taken by the characters
console.log(simulation.characters.map(character => character.combinedDamageDetails));
```

## Assumptions
Unfortunately the rules in the Shadowrun Core Rulebook have some shortcomings. I had to make some assumptions to make the simulation work. I have done my best to document them here, but this list may be incomplete as I am writing them _post hoc_.

1. Barrier segments are at most 1 metre long. This means that the final segment of a barrier may be shorter than 1 metre if the total length of the barrier is not an integer. All segments are assumed to have the same Structure and Armour as the barrier, regardless of their length.
2. The simulation is two-dimensional. The effects of floors and ceilings are ignored, as is the possibility of explosions passing over barriers and the elevation of characters. 
3. Stun damage not only does not damage barriers, but it is also not reflected off barriers. This is primarily due to the fact that reflecting stun grenades (which do not have a decay) would lead to characters in small spaces taking 150+ stun damage and making the simulation feel completely unusable.
4. Explosion blast waves travel at constant speed for all explosions. This allows the explosions to be processed in order of distance, which means it is possible for a closer explosion to damage a barrier, and a second explosion to destroy it (even if it wouldn't be possible for the second exposion to destroy the barrier on its own).
