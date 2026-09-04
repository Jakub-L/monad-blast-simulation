/** The type of damage dealt by an explosion. */
export enum DamageType {
  /** Physical damage. */
  PHYSICAL,
  /** Stun damage. Ignored by barriers. */
  STUN
}
/** A point in 2D euclidean space */
export type Point = {
  /** The x coordinate of the point */
  x: number;
  /** The y coordinate of the point */
  y: number;
};
