// Swap recommendation: when a variation's life cycle ends, ask where the user
// failed, map that to a weak point, and rank same-pattern library variations
// that bias toward fixing it.

import type { Pattern, SeedVariation, VariationRosterEntry } from '../data/types';
import { Tuning } from './tuning';
import { e1rm } from './e1rm';

/** Failure modes offered per pattern in the swap flow's first step. */
export const FAILURE_MODES: Record<string, { id: string; weakPoint: string }[]> = {
  horizontal_press: [
    { id: 'off_chest', weakPoint: 'off_chest' },
    { id: 'midrange', weakPoint: 'midrange' },
    { id: 'lockout', weakPoint: 'lockout' },
  ],
  vertical_press: [
    { id: 'bottom', weakPoint: 'off_chest' },
    { id: 'midrange', weakPoint: 'midrange' },
    { id: 'lockout', weakPoint: 'lockout' },
  ],
  squat: [
    { id: 'bottom', weakPoint: 'bottom' },
    { id: 'midrange', weakPoint: 'midrange' },
    { id: 'lockout', weakPoint: 'lockout' },
  ],
  hinge: [
    { id: 'off_floor', weakPoint: 'stretch' },
    { id: 'lockout', weakPoint: 'lockout' },
  ],
  horizontal_pull: [
    { id: 'stretch', weakPoint: 'stretch' },
    { id: 'contraction', weakPoint: 'contraction' },
  ],
  vertical_pull: [
    { id: 'stretch', weakPoint: 'stretch' },
    { id: 'contraction', weakPoint: 'contraction' },
  ],
};

export function failureModesForPattern(pattern: Pattern): { id: string; weakPoint: string }[] {
  return FAILURE_MODES[pattern] ?? [{ id: 'general', weakPoint: 'general' }];
}

export interface RankedCandidate {
  exercise: SeedVariation;
  score: number;
  targetsWeakPoint: boolean;
  priorEffectiveness: number;
  usedRecently: boolean;
  reasons: string[];
}

export interface RankOptions {
  weakPoint: string;
  roster: VariationRosterEntry[]; // user's own history for this pattern
  recentlyUsed: string[]; // exercise names used recently (avoid repeats)
  currentExerciseName?: string;
  maxResults?: number;
}

/**
 * Rank candidates by: (a) targets the chosen weak point, (b) the user's own
 * historical effectiveness if previously run, (c) not used recently.
 */
export function rankSwapCandidates(
  candidates: SeedVariation[],
  opts: RankOptions,
): RankedCandidate[] {
  const maxEff = Math.max(0.0001, ...opts.roster.map((r) => r.effectiveness));
  const ranked = candidates
    .filter((c) => c.nameEn !== opts.currentExerciseName)
    .map((exercise) => {
      const targetsWeakPoint = exercise.weakPoints.includes(opts.weakPoint);
      const priorEntry = opts.roster.find((r) => r.exerciseName === exercise.nameEn);
      const priorEffectiveness = priorEntry ? priorEntry.effectiveness / maxEff : 0;
      const usedRecently = opts.recentlyUsed.includes(exercise.nameEn);

      const reasons: string[] = [];
      let score = 0;
      if (targetsWeakPoint) {
        score += 1.0;
        reasons.push('targets your weak point');
      }
      if (priorEntry) {
        score += 0.6 * priorEffectiveness;
        reasons.push('proven for you before');
      }
      if (usedRecently) {
        score -= 0.5;
        reasons.push('used recently');
      } else {
        score += 0.1;
      }
      return { exercise, score, targetsWeakPoint, priorEffectiveness, usedRecently, reasons };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, opts.maxResults ?? 3);
}

/**
 * Carry-forward starting load: scale prior e1RM down by a conservative factor
 * and seed the new variation near the TOP of the rep range, rounded to the
 * nearest available increment.
 */
export function carryForwardLoad(
  priorE1RM: number,
  units: 'kg' | 'lb',
  targetReps = Tuning.carryForwardTargetReps,
): { weight: number; reps: number } {
  const targetE1RM = priorE1RM * Tuning.carryForwardFactor;
  // invert Epley: weight = e1rm / (1 + reps/30)
  const raw = targetE1RM / (1 + targetReps / 30);
  const inc = Tuning.increments[units];
  const weight = Math.max(0, Math.round(raw / inc) * inc);
  return { weight: round2(weight), reps: targetReps };
}

export function e1rmFromTopSet(weight: number, reps: number): number {
  return e1rm(weight, reps);
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
