import type { Point } from '@/types';

/** A 2D vector */
export class Vector {
  /** The x component. */
  private _x: number;
  /** The y component. */
  private _y: number;
  /** The magnitude of this vector. */
  private _length: number;

  /** Creates a vector from a point.
   * @param p - The point to create the vector from
   * @returns A new vector from the starting point to the ending point
   */
  constructor(p: Point);
  /** Creates a vector from Cartesian components.
   * @param x - The x component
   * @param y - The y component
   * @returns A new vector with the given components
   */
  constructor(x: number, y: number);
  constructor(pOrX: Point | number, y: number = 0) {
    if (typeof pOrX === 'object') {
      this._x = pOrX.x;
      this._y = pOrX.y;
    } else {
      this._x = pOrX;
      this._y = y;
    }

    this._length = Math.hypot(this._x, this._y);
  }

  // INSTANCE METHODS
  /** Returns a deep copy of this vector. */
  clone(): Vector {
    return new Vector(this._x, this._y);
  }
  /**
   * Returns a unit vector in the same direction.
   * @returns A normalized copy of this vector
   */
  normalize(): Vector {
    return new Vector(this._x / this._length, this._y / this._length);
  }

  /**
   * Adds a vector to this vector.
   * @param v - The vector to add
   * @returns A new vector with the sum of this vector and the given vector
   */
  add(v: Point | Vector): Vector {
    return new Vector(this._x + v.x, this._y + v.y);
  }

  /**
   * Subtracts a vector from this vector.
   * @param v - The vector to subtract
   * @returns A new vector with the difference of this vector and the given vector
   */
  sub(v: Point | Vector): Vector {
    return new Vector(this._x - v.x, this._y - v.y);
  }

  /**
   * Multiplies this vector by a scalar.
   * @param s - The scalar to multiply by
   * @returns A new vector with the product of this vector and the given scalar
   */
  scale(s: number): Vector {
    return new Vector(this._x * s, this._y * s);
  }

  /**
   * Computes the dot product of this vector and another vector.
   * @param v - The vector to compute the dot product with
   * @returns The dot product of this vector and the given vector
   */
  dot(v: Vector): number {
    return this._x * v.x + this._y * v.y;
  }

  /**
   * Computes the cross product of this vector and another vector.
   * Computes THIS × V.
   * @param v - The vector to compute the cross product with
   * @returns The cross product of this vector and the given vector
   */
  cross(v: Vector): number {
    return this._x * v.y - this._y * v.x;
  }

  // GETTERS
  /** The x component. */
  get x(): number {
    return this._x;
  }

  /** The y component. */
  get y(): number {
    return this._y;
  }

  /** The magnitude of this vector. */
  get length(): number {
    return this._length;
  }

  // STATIC METHODS
  /**
   * Creates a vector from one point to another.
   * @param from - The starting point
   * @param to - The ending point
   * @returns A new vector from the starting point to the ending point
   */
  static fromTo(from: Point, to: Point): Vector {
    return new Vector(to.x - from.x, to.y - from.y);
  }
}
