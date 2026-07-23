// Plate calculator + warm-up weight helpers.
import type { Units } from '../data/types';

// Available plates per side (heaviest first).
const PLATES: Record<Units, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

export function defaultBar(units: Units): number {
  return units === 'kg' ? 20 : 45;
}

export interface PlatePlan {
  perSide: { plate: number; count: number }[];
  leftover: number; // weight that can't be matched by available plates (per side, x2)
  achievable: number; // the actual total that the plates make up
}

/** Greedy plate breakdown per side for a target total barbell weight. */
export function platesFor(target: number, units: Units, bar = defaultBar(units)): PlatePlan {
  const perSideWeight = Math.max(0, (target - bar) / 2);
  let remaining = perSideWeight;
  const perSide: { plate: number; count: number }[] = [];
  for (const p of PLATES[units]) {
    const count = Math.floor(remaining / p + 1e-9);
    if (count > 0) {
      perSide.push({ plate: p, count });
      remaining = round2(remaining - count * p);
    }
  }
  const used = perSideWeight - remaining;
  return { perSide, leftover: round2(remaining), achievable: round2(bar + used * 2) };
}

/** Warm-up ramp weights from a working weight (rounded to the smallest plate). */
export function warmupWeights(working: number, units: Units): { pct: number; weight: number }[] {
  if (working <= 0) return [];
  const inc = units === 'kg' ? 2.5 : 5;
  const mk = (pct: number) => ({ pct, weight: Math.max(inc, Math.round((working * pct) / inc) * inc) });
  return [mk(0.5), mk(0.75)];
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
