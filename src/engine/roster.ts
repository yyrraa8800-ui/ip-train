// Roster scoring: a proven-variations leaderboard per pattern. Effectiveness =
// strength gained per week. Longer cycle + bigger gain = better variation to
// cycle back in.

import type { ExerciseLifeCycle, Pattern, VariationRosterEntry } from '../data/types';

export function effectiveness(strengthGained: number, durationWeeks: number): number {
  const weeks = Math.max(0.5, durationWeeks); // avoid divide-by-zero / over-reward 1-session cycles
  return strengthGained / weeks;
}

export function rosterEntryFromLifeCycle(lc: ExerciseLifeCycle): VariationRosterEntry {
  return {
    pattern: lc.pattern,
    exerciseName: lc.exerciseName,
    durationWeeks: lc.durationWeeks,
    strengthGained: lc.strengthGained,
    effectiveness: effectiveness(lc.strengthGained, lc.durationWeeks),
    endedAt: lc.endDate,
    active: lc.status !== 'ended',
  };
}

/** Sort a pattern's variations best-first. */
export function rankRoster(entries: VariationRosterEntry[]): VariationRosterEntry[] {
  return [...entries].sort((a, b) => b.effectiveness - a.effectiveness);
}

export function rosterForPattern(
  entries: VariationRosterEntry[],
  pattern: Pattern,
): VariationRosterEntry[] {
  return rankRoster(entries.filter((e) => e.pattern === pattern));
}

/**
 * A 0..1 "level" for a pattern, from total strength gained across its roster,
 * scaled so the home-screen rings have something meaningful to show early.
 * Uses a soft saturating curve so progress is always visible but never maxes.
 */
export function patternLevel(entries: VariationRosterEntry[], pattern: Pattern): number {
  const total = entries
    .filter((e) => e.pattern === pattern)
    .reduce((s, e) => s + Math.max(0, e.strengthGained), 0);
  // saturating: level = total / (total + k)
  const k = 40;
  return total / (total + k);
}
