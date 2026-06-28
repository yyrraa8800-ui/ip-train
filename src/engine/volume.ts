// Weekly volume per muscle, recomputed from the actual program (the
// spreadsheet's table had broken #REF! cells, which we ignore), plus
// MEV/MAV/MRV landmark comparison. Landmarks from Renaissance Periodization
// (Israetel et al.) — see RESEARCH.md.

import type { SeedProgram } from '../data/types';

export type VolumeStatus = 'under' | 'optimal' | 'over';

export interface Landmark {
  mev: number; // minimum effective volume
  mav: [number, number]; // maximum adaptive volume window
  mrv: number; // maximum recoverable volume
}

// Weekly hard sets per muscle. Conservative, intermediate-oriented defaults.
export const LANDMARKS: Record<string, Landmark> = {
  Chest: { mev: 10, mav: [12, 20], mrv: 22 },
  Back: { mev: 10, mav: [14, 22], mrv: 25 },
  'Front delts': { mev: 0, mav: [6, 8], mrv: 12 },
  'Side delts': { mev: 8, mav: [16, 22], mrv: 26 },
  'Rear delts': { mev: 6, mav: [10, 20], mrv: 25 },
  Biceps: { mev: 8, mav: [14, 20], mrv: 26 },
  Triceps: { mev: 6, mav: [10, 14], mrv: 18 },
  Quads: { mev: 8, mav: [12, 18], mrv: 20 },
  Hamstring: { mev: 6, mav: [10, 16], mrv: 20 },
  Glutes: { mev: 0, mav: [4, 12], mrv: 16 },
  Calves: { mev: 8, mav: [12, 16], mrv: 20 },
  Forearms: { mev: 4, mav: [8, 12], mrv: 16 },
  Abs: { mev: 0, mav: [16, 20], mrv: 25 },
  Traps: { mev: 0, mav: [4, 12], mrv: 16 },
};

export const MUSCLE_ORDER = Object.keys(LANDMARKS);

/**
 * Sum sets per muscle for a given (1-based) week index. Clamps to the available
 * range and uses the deload sets for the deload week.
 */
export function weeklyVolume(program: SeedProgram, weekIndex: number): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const key of MUSCLE_ORDER) totals[key] = 0;

  for (const day of program.days) {
    if (day.isRest) continue;
    for (const ex of day.exercises) {
      const sets = setsForWeek(ex.setsByWeek, ex.deloadSets, weekIndex, program.weeks);
      if (!(ex.muscleKey in totals)) totals[ex.muscleKey] = 0;
      totals[ex.muscleKey] += sets;
    }
  }
  return totals;
}

export function setsForWeek(
  setsByWeek: number[],
  deloadSets: number,
  weekIndex: number,
  weeks: number,
): number {
  if (weekIndex > weeks) return deloadSets; // deload week
  const i = Math.max(0, Math.min(setsByWeek.length - 1, weekIndex - 1));
  return setsByWeek[i] ?? 0;
}

export function totalSets(volume: Record<string, number>): number {
  return Object.values(volume).reduce((a, b) => a + b, 0);
}

export function volumeStatus(muscle: string, sets: number): VolumeStatus {
  const lm = LANDMARKS[muscle];
  if (!lm) return 'optimal';
  if (sets < lm.mev) return 'under';
  if (sets > lm.mrv) return 'over';
  return 'optimal';
}

/** Fraction 0..1 of MRV, for drawing the volume bar relative to the landmark band. */
export function volumeFraction(muscle: string, sets: number): number {
  const lm = LANDMARKS[muscle];
  if (!lm || lm.mrv <= 0) return 0;
  return Math.min(1.2, sets / lm.mrv);
}
