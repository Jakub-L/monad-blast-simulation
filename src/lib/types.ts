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

/** A line segment in 2D euclidean space */
export type Segment = {
  /** The start point of the segment. */
  start: Point;
  /** The end point of the segment. */
  end: Point;
};
