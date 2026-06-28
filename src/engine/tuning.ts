// All tunable thresholds for the IP engine live here so they are easy to adjust
// without touching logic. Values are evidence-informed defaults; see RESEARCH.md.

import type { Units } from '../data/types';

export const Tuning = {
  // Rep range used by the whole program (double progression target).
  repRange: [6, 12] as [number, number],

  // e1RM flatness epsilon (as a fraction of e1RM) — below this, two sessions are
  // considered "the same" for stall detection.
  e1rmEpsilonFraction: 0.01, // 1%

  // Life-cycle thresholds.
  endedConsecutiveZeroRatings: 2, // N zero-rating sessions in a row => ended
  slowingFlatSessions: 2, // sessions without a new e1RM high => slowing
  noNewHighSessions: 3, // sessions without a new e1RM high => ended

  // Carry-forward: scale the prior variation's e1RM by this conservative factor
  // and seed the new variation near the TOP of the rep range to start fresh.
  carryForwardFactor: 0.9,
  carryForwardTargetReps: 10,

  // Plate / increment options for rounding suggested loads.
  increments: {
    kg: 1.25,
    lb: 2.5,
  } as Record<Units, number>,
};

export function e1rmEpsilon(referenceE1RM: number): number {
  return Math.max(0.5, referenceE1RM * Tuning.e1rmEpsilonFraction);
}
