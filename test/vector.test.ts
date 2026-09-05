import { describe, expect, test } from 'vitest';

import { Vector } from '@/utils/vector';

describe('Vector', () => {
  test('should create a vector from a point', () => {
    const vector = new Vector({ x: 1, y: 2 });
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
    expect(vector.length).toBeCloseTo(Math.sqrt(5));
  });

  test('should create a vector from Cartesian components', () => {
    const vector = new Vector(-3, 4);
    expect(vector.x).toBe(-3);
    expect(vector.y).toBe(4);
    expect(vector.length).toBe(5);
  });

  test('should clone a vector without sharing the instance', () => {
    const vector = new Vector(3, -4);
    const clone = vector.clone();
    expect(clone).not.toBe(vector);
    expect(clone.x).toBe(vector.x);
    expect(clone.y).toBe(vector.y);
    expect(clone.length).toBe(vector.length);
  });

  test('should normalize a vector', () => {
    const vector = new Vector(3, 4);
    const normalized = vector.normalize();
    expect(normalized).not.toBe(vector);
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
    expect(normalized.length).toBeCloseTo(1);
    expect(vector.x).toBe(3);
    expect(vector.y).toBe(4);
  });

  test('should produce NaN components when normalizing a zero vector', () => {
    const normalized = new Vector(0, 0).normalize();
    expect(normalized.x).toBeNaN();
    expect(normalized.y).toBeNaN();
    expect(normalized.length).toBeNaN();
  });

  test('should add a point', () => {
    const vector = new Vector(2, -3);
    const result = vector.add({ x: 4, y: 5 });
    expect(result).not.toBe(vector);
    expect(result.x).toBe(6);
    expect(result.y).toBe(2);
  });

  test('should add another vector', () => {
    const vector = new Vector(2, -3); 
    const result = vector.add(new Vector(4, 5));
    expect(result).not.toBe(vector);
    expect(result.x).toBe(6);
    expect(result.y).toBe(2);
  });

  test('should subtract a point', () => {
    const vector = new Vector(2, -3);
    const result = vector.sub({ x: 4, y: 5 });
    expect(result).not.toBe(vector);
    expect(result.x).toBe(-2);
    expect(result.y).toBe(-8);
  });

  test('should subtract another vector', () => {
    const vector = new Vector(2, -3);
    const result = vector.sub(new Vector(4, 5));
    expect(result).not.toBe(vector);
    expect(result.x).toBe(-2);
    expect(result.y).toBe(-8);
  });

  test('should scale a vector by a scalar', () => {
    const vector = new Vector(2, -3);
    const result = vector.scale(-2);
    expect(result).not.toBe(vector);
    expect(result.x).toBe(-4);
    expect(result.y).toBe(6);
    expect(result.length).toBe(vector.length * 2);
  });

  test('should calculate the dot product', () => {
    expect(new Vector(2, 3).dot(new Vector(4, -1))).toBe(5);
  });

  test('should calculate the cross product', () => {
    expect(new Vector(2, 3).cross(new Vector(4, -1))).toBe(-14);
  });

  test('should create a vector from one point to another', () => {
    const result = Vector.fromTo({ x: 4, y: 6 }, { x: -1, y: 2 });
    expect(result.x).toBe(-5);
    expect(result.y).toBe(-4);
    expect(result.length).toBeCloseTo(Math.sqrt(41));
  });
});