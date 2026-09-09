export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Framerate-independent exponential smoothing: moves `current` towards
 *  `target` at `rate` (1/seconds). Use this instead of a fixed-per-frame
 *  lerp everywhere in the juice/physics layer so the game feels the same
 *  at 30fps and 120fps. */
export function expSmooth(current: number, target: number, rate: number, dt: number): number {
  const t = 1 - Math.exp(-rate * dt);
  return lerp(current, target, t);
}

/** Moves `current` toward `target` by at most `maxDelta` — a linear ramp
 *  (constant acceleration when maxDelta = rate * dt), unlike expSmooth's
 *  exponential ease. Used for the player's lateral speed so steering has a
 *  genuine acceleration/deceleration curve instead of an ease-out feel. */
export function moveTowards(current: number, target: number, maxDelta: number): number {
  const delta = target - current;
  if (Math.abs(delta) <= maxDelta) return target;
  return current + Math.sign(delta) * maxDelta;
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(minInclusive: number, maxInclusive: number): number {
  return Math.floor(randRange(minInclusive, maxInclusive + 1));
}
