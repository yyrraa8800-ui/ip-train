// The IP core: detect where an exercise variation is in its life cycle from the
// session-by-session top-set e1RM series.

import type { LifePoint, LifeStatus, SetEntry } from '../data/types';
import { topSetE1RM } from './e1rm';
import { Tuning, e1rmEpsilon } from './tuning';

export interface LifeCycleEval {
  status: LifeStatus;
  /** 0..1 — how far along the "runway" toward ended (drives the life-cycle bar). */
  runway: number;
  startE1RM: number;
  currentE1RM: number;
  bestE1RM: number;
  strengthGained: number;
  durationWeeks: number;
  sessionsSinceHigh: number;
  consecutiveZeroRatings: number;
}

/**
 * Auto progression rating for a session (mirrors the sheet's 0/1):
 * 1 if this session's top-set e1RM beat the previous session's, else 0.
 * Volume is used as a tie-breaker when e1RM is within epsilon.
 */
export function progressionRating(
  prevE1RM: number,
  curE1RM: number,
  prevVolume = 0,
  curVolume = 0,
): 0 | 1 {
  if (prevE1RM <= 0) return 1; // first session always "progresses"
  const eps = e1rmEpsilon(prevE1RM);
  if (curE1RM > prevE1RM + eps) return 1;
  if (curE1RM < prevE1RM - eps) return 0;
  // e1RM flat → fall back to volume.
  return curVolume > prevVolume ? 1 : 0;
}

/** Build a life-cycle point from a session's working sets. */
export function lifePointFromSets(
  date: string,
  sets: SetEntry[],
  prev: LifePoint | undefined,
  repRange: [number, number] = Tuning.repRange,
): LifePoint {
  const e1 = topSetE1RM(sets);
  const working = sets.filter((s) => !s.isWarmup && s.reps > 0);
  const prevVol = 0; // volume tie-break handled at session level if needed
  const rating = progressionRating(prev?.e1rm ?? 0, e1, prevVol, prevVol);
  // reps "at the bottom" of the range = the heaviest working set is already at
  // the minimum reps (can't drop reps further, must add load).
  const minReps = working.length ? Math.min(...working.map((s) => s.reps)) : repRange[1];
  const repsAtBottom = working.length > 0 && minReps <= repRange[0];
  return { date, e1rm: e1, rating, repsAtBottom };
}

/** Evaluate the whole series for a variation's current cycle. */
export function evaluateLifeCycle(series: LifePoint[]): LifeCycleEval {
  if (series.length === 0) {
    return {
      status: 'alive',
      runway: 0,
      startE1RM: 0,
      currentE1RM: 0,
      bestE1RM: 0,
      strengthGained: 0,
      durationWeeks: 0,
      sessionsSinceHigh: 0,
      consecutiveZeroRatings: 0,
    };
  }

  const startE1RM = series[0].e1rm;
  const currentE1RM = series[series.length - 1].e1rm;

  // Sessions since the last new e1RM high.
  let bestSoFar = -Infinity;
  let sessionsSinceHigh = 0;
  let bestE1RM = 0;
  for (const p of series) {
    const eps = e1rmEpsilon(Math.max(1, bestSoFar === -Infinity ? p.e1rm : bestSoFar));
    if (p.e1rm > bestSoFar + eps) {
      bestSoFar = p.e1rm;
      sessionsSinceHigh = 0;
    } else {
      sessionsSinceHigh += 1;
    }
    bestE1RM = Math.max(bestE1RM, p.e1rm);
  }

  // Trailing run of zero ratings.
  let consecutiveZeroRatings = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].rating === 0) consecutiveZeroRatings += 1;
    else break;
  }

  const repsBottomed = series[series.length - 1].repsAtBottom;

  const ended =
    consecutiveZeroRatings >= Tuning.endedConsecutiveZeroRatings ||
    (sessionsSinceHigh >= Tuning.noNewHighSessions && repsBottomed) ||
    sessionsSinceHigh >= Tuning.noNewHighSessions + 1;

  const slowing =
    !ended &&
    (sessionsSinceHigh >= Tuning.slowingFlatSessions || consecutiveZeroRatings >= 1);

  const status: LifeStatus = ended ? 'ended' : slowing ? 'slowing' : 'alive';

  const runway = clamp(sessionsSinceHigh / (Tuning.noNewHighSessions + 1), 0, 1);

  const durationWeeks = weeksBetween(series[0].date, series[series.length - 1].date);

  return {
    status,
    runway,
    startE1RM,
    currentE1RM,
    bestE1RM,
    strengthGained: Math.max(0, bestE1RM - startE1RM),
    durationWeeks,
    sessionsSinceHigh,
    consecutiveZeroRatings,
  };
}

export function weeksBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const days = Math.abs(b - a) / (1000 * 60 * 60 * 24);
  return Math.max(0, days / 7);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
