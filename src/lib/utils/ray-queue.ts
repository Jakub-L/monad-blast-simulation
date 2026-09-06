import type { Ray } from '@/utils/ray';

/** A queue of rays, sorted by the distance travelled, implemented as a min-heap. */
export class RayQueue {
  /** The heap of rays. */
  private _heap: Map<number, Ray> = new Map();

  /**
   * Creates a new ray queue.
   * @param array - The array of rays to add to the queue.
   */
  constructor(array: Ray[]) {
    for (const value of array) this._insert(value);
    for (let i = Math.floor(this.size / 2) - 1; i >= 0; i--) this._sink(i);
  }

  /**
   * Adds a ray to the queue and reorders the heap to maintain the sort order.
   * @param ray - The ray to add.
   */
  add(ray: Ray): void {
    this._insert(ray);
    this._swim(this.size - 1);
  }

  /**
   * Removes and returns the ray with the shortest distance travelled from the queue.
   * @returns The ray with the shortest distance travelled, or null if the queue is empty.
   */
  pop(): Ray | null {
    if (this.isEmpty) return null;
    return this._removeAt(0) ?? null;
  }

  /**
   * Inserts a ray into the heap without reordering the heap.
   * @param ray - The ray to insert.
   */
  private _insert(ray: Ray): void {
    this._heap.set(this.size, ray);
  }

  /**
   * Removes and returns the ray at the given index from the heap and reorders the heap to maintain the sort order.
   * @param index - The index of the ray to remove.
   * @returns The ray at the given index, or null if the index is out of bounds.
   */
  private _removeAt(index: number): Ray | null {
    const lastIndex = this.size - 1;
    const removedNode = this._heap.get(index) ?? null;
    this._swap(index, lastIndex);
    this._heap.delete(lastIndex);

    if (index === lastIndex) return removedNode;

    const node = this._heap.get(index) ?? null;
    this._sink(index);
    if (this._heap.get(index)?.id === node?.id) this._swim(index);

    return removedNode;
  }

  /**
   * Moves a ray up the heap until it is in the correct position.
   * @param index - The index of the ray to move up.
   */
  private _swim(index: number): void {
    let parentIndex = Math.floor((index - 1) / 2);
    while (index > 0 && this._less(index, parentIndex)) {
      this._swap(index, parentIndex);
      [index, parentIndex] = [parentIndex, Math.floor((parentIndex - 1) / 2)];
    }
  }

  /**
   * Moves a ray down the heap until it is in the correct position.
   * @param index - The index of the ray to move down.
   */
  private _sink(index: number): void {
    while (true) {
      const [left, right] = [2 * index + 1, 2 * index + 2];
      const smallest =
        right < this.size && this._less(right, left) ? right : left;
      if (left >= this.size || this._less(index, smallest)) return;
      this._swap(smallest, index);
      index = smallest;
    }
  }

  /**
   * Swaps two rays in the heap.
   * @param i - The index of the first ray to swap.
   * @param j - The index of the second ray to swap.
   * @throws RangeError if either index is out of bounds.
   */
  private _swap(i: number, j: number): void {
    const [a, b] = [this._heap.get(i), this._heap.get(j)];
    if (!a || !b) throw new RangeError('Index out of bounds');
    this._heap.set(i, b);
    this._heap.set(j, a);
  }

  /**
   * Compares two rays in the heap by their distance travelled.
   * @param i - The index of the first ray to compare.
   * @param j - The index of the second ray to compare.
   * @returns True if the first ray has a shorter distance travelled than the second, false otherwise.
   * @throws RangeError if either index is out of bounds.
   */
  private _less(i: number, j: number): boolean {
    const [a, b] = [this._heap.get(i), this._heap.get(j)];
    if (!a || !b) throw new RangeError('Index out of bounds');
    return a.travelledDistance < b.travelledDistance;
  }

  // GETTERS
  /** The number of rays in the queue. */
  get size(): number {
    return this._heap.size;
  }

  /** Whether the queue is empty. */
  get isEmpty(): boolean {
    return this._heap.size === 0;
  }
}
