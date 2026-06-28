// Estimated 1-rep-max. Epley is the primary progression signal (so that a
// session where weight goes up but reps go down is still scored correctly).
// Brzycki is stored as a cross-check. See RESEARCH.md for formulas + sources.

import type { SetEntry } from '../data/types';

export function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function brzycki(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps >= 37) return weight; // formula breaks down
  return weight * (36 / (37 - reps));
}

/** Primary e1RM signal used by the engine. */
export function e1rm(weight: number, reps: number): number {
  return epley(weight, reps);
}

/** The best (highest e1RM) working set in a list. Warm-ups are ignored. */
export function topSetE1RM(sets: SetEntry[]): number {
  return sets
    .filter((s) => !s.isWarmup && s.weight > 0 && s.reps > 0)
    .reduce((best, s) => Math.max(best, e1rm(s.weight, s.reps)), 0);
}

/** Total working volume = sum(weight * reps) over non-warmup sets. */
export function workingVolume(sets: SetEntry[]): number {
  return sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + Math.max(0, s.weight) * Math.max(0, s.reps), 0);
}
