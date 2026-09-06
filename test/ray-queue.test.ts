import { describe, expect, test } from 'vitest';

import type { Ray } from '@/utils/ray';
import { RayQueue } from '@/utils/ray-queue';

const ray = (id: string, travelledDistance: number): Ray =>
  ({ id, travelledDistance }) as Ray;

describe('RayQueue', () => {
  test('should start empty and return null when popped', () => {
    const queue = new RayQueue([]);

    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);
    expect(queue.pop()).toBeNull();
  });

  test('should heapify rays and pop them in distance order', () => {
    const rays = [
      ray('slow', 5),
      ray('fast', 1),
      ray('far', 4),
      ray('near', 2),
      ray('middle', 3)
    ];
    const queue = new RayQueue(rays);

    expect(queue.size).toBe(rays.length);
    expect(queue.isEmpty).toBe(false);
    expect(queue.pop()?.id).toBe('fast');
    expect(queue.pop()?.id).toBe('near');
    expect(queue.pop()?.id).toBe('middle');
    expect(queue.pop()?.id).toBe('far');
    expect(queue.pop()?.id).toBe('slow');
    expect(queue.pop()).toBeNull();
  });

  test('should choose the right child when it is shorter', () => {
    const queue = new RayQueue([
      ray('long', 5),
      ray('longer', 4),
      ray('short', 1)
    ]);

    expect(queue.pop()?.id).toBe('short');
    expect(queue.pop()?.id).toBe('longer');
    expect(queue.pop()?.id).toBe('long');
  });

  test('should swim a newly added ray into position', () => {
    const queue = new RayQueue([ray('long', 5)]);

    queue.add(ray('short', 1));
    queue.add(ray('middle', 3));

    expect(queue.pop()?.id).toBe('short');
    expect(queue.pop()?.id).toBe('middle');
    expect(queue.pop()?.id).toBe('long');
  });

  test('should sink the replacement ray after popping', () => {
    const queue = new RayQueue([
      ray('first', 1),
      ray('second', 2),
      ray('third', 3),
      ray('fourth', 4),
      ray('fifth', 5),
      ray('sixth', 6),
      ray('seventh', 7)
    ]);

    expect(queue.pop()?.id).toBe('first');
    expect(queue.pop()?.id).toBe('second');
    expect(queue.pop()?.id).toBe('third');
  });

  test('should throw when private heap operations receive invalid indexes', () => {
    const queue = new RayQueue([]);
    const internal = queue as unknown as {
      _heap: Map<number, Ray>;
      _less: (i: number, j: number) => boolean;
      _removeAt: (index: number) => Ray | null;
      _swap: (i: number, j: number) => void;
    };

    expect(() => internal._removeAt(0)).toThrowError(RangeError);
    expect(() => internal._swap(0, 0)).toThrowError(RangeError);
    expect(() => internal._less(0, 0)).toThrowError(RangeError);

    const emptyResult = new RayQueue([ray('only', 1)]) as unknown as {
      _removeAt: (index: number) => Ray | null;
    };
    emptyResult._removeAt = () => null;
    expect((emptyResult as unknown as RayQueue).pop()).toBeNull();

    const missingNode = new RayQueue([
      ray('first', 1),
      ray('second', 2)
    ]) as unknown as {
      _heap: Map<number, Ray>;
      _removeAt: (index: number) => Ray | null;
      _swap: (i: number, j: number) => void;
    };
    missingNode._swap = () => missingNode._heap.delete(0);
    expect(missingNode._removeAt(0)?.id).toBe('first');
  });
});
