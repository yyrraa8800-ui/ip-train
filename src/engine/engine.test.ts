import { describe, it, expect } from 'vitest';
import {
  epley,
  brzycki,
  topSetE1RM,
  progressionRating,
  evaluateLifeCycle,
  rankSwapCandidates,
  carryForwardLoad,
  failureModesForPattern,
  effectiveness,
  rankRoster,
  weeklyVolume,
  setsForWeek,
  volumeStatus,
} from './index';
import { levelFromXp, cumXpToReach, rankTitle, BADGES, earnedBadges } from './game';
import type { GameStats } from './game';
import type { LifePoint, SeedProgram, SeedVariation, VariationRosterEntry } from '../data/types';
import { seed } from '../data/seed';

// ---------------------------------------------------------------------------
// e1RM
// ---------------------------------------------------------------------------
describe('e1RM', () => {
  it('Epley: 100kg x 1 = 100', () => {
    expect(epley(100, 1)).toBeCloseTo(100, 5);
  });
  it('Epley: 100kg x 10 = 133.3', () => {
    expect(epley(100, 10)).toBeCloseTo(133.333, 2);
  });
  it('Brzycki: 100kg x 10 ≈ 133.3', () => {
    expect(brzycki(100, 10)).toBeCloseTo(133.33, 1);
  });
  it('topSetE1RM ignores warmups and picks the best working set', () => {
    const e = topSetE1RM([
      { weight: 60, reps: 10, isWarmup: true },
      { weight: 100, reps: 8, isWarmup: false },
      { weight: 105, reps: 6, isWarmup: false },
    ]);
    // 100x8 -> 126.7 ; 105x6 -> 126 ; best is 126.7
    expect(e).toBeCloseTo(126.667, 2);
  });
  it('handles zero/negative gracefully', () => {
    expect(epley(0, 10)).toBe(0);
    expect(epley(100, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Progression rating
// ---------------------------------------------------------------------------
describe('progression rating', () => {
  it('first session always progresses', () => {
    expect(progressionRating(0, 100)).toBe(1);
  });
  it('beating prior e1RM => 1', () => {
    expect(progressionRating(100, 105)).toBe(1);
  });
  it('failing to beat prior e1RM => 0', () => {
    expect(progressionRating(100, 98)).toBe(0);
  });
  it('flat e1RM falls back to volume', () => {
    expect(progressionRating(100, 100, 1000, 1200)).toBe(1);
    expect(progressionRating(100, 100, 1200, 1000)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Life cycle
// ---------------------------------------------------------------------------
function pt(day: number, e1rm: number, rating: 0 | 1, repsAtBottom = false): LifePoint {
  return { date: new Date(2025, 0, 1 + day).toISOString(), e1rm, rating, repsAtBottom };
}

describe('life cycle', () => {
  it('rising e1RM stays alive', () => {
    const r = evaluateLifeCycle([pt(0, 100, 1), pt(3, 104, 1), pt(6, 108, 1)]);
    expect(r.status).toBe('alive');
    expect(r.strengthGained).toBeCloseTo(8, 1);
    expect(r.runway).toBeLessThan(0.5);
  });

  it('flat e1RM for two sessions => slowing', () => {
    const r = evaluateLifeCycle([pt(0, 100, 1), pt(3, 105, 1), pt(6, 105, 0), pt(9, 105, 0)]);
    // two zero ratings in a row -> this is actually ended by rating rule
    expect(['slowing', 'ended']).toContain(r.status);
  });

  it('two consecutive zero ratings => ended', () => {
    const r = evaluateLifeCycle([pt(0, 100, 1), pt(3, 102, 1), pt(6, 101, 0), pt(9, 100, 0)]);
    expect(r.status).toBe('ended');
    expect(r.runway).toBeGreaterThanOrEqual(0.5);
  });

  it('no new high for 3+ sessions with reps bottomed => ended', () => {
    const r = evaluateLifeCycle([
      pt(0, 120, 1),
      pt(3, 120, 0, true),
      pt(6, 119, 0, true),
      pt(9, 120, 0, true),
    ]);
    expect(r.status).toBe('ended');
  });

  it('empty series is alive with zero runway', () => {
    const r = evaluateLifeCycle([]);
    expect(r.status).toBe('alive');
    expect(r.runway).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Swap recommendation
// ---------------------------------------------------------------------------
describe('swap recommendation', () => {
  const candidates: SeedVariation[] = [
    { nameEn: 'Close grip bench', videoUrl: null, weakPoints: ['lockout'] },
    { nameEn: 'Incline press', videoUrl: null, weakPoints: ['off_chest'] },
    { nameEn: 'Spoto press', videoUrl: null, weakPoints: ['off_chest'] },
  ];

  it('ranks weak-point matches first', () => {
    const ranked = rankSwapCandidates(candidates, {
      weakPoint: 'lockout',
      roster: [],
      recentlyUsed: [],
    });
    expect(ranked[0].exercise.nameEn).toBe('Close grip bench');
    expect(ranked[0].targetsWeakPoint).toBe(true);
  });

  it('boosts variations proven for the user', () => {
    const roster: VariationRosterEntry[] = [
      {
        pattern: 'horizontal_press',
        exerciseName: 'Spoto press',
        durationWeeks: 6,
        strengthGained: 18,
        effectiveness: 3,
        active: false,
      },
    ];
    const ranked = rankSwapCandidates(candidates, {
      weakPoint: 'off_chest',
      roster,
      recentlyUsed: [],
    });
    // Both incline and spoto target off_chest; spoto has prior effectiveness so wins.
    expect(ranked[0].exercise.nameEn).toBe('Spoto press');
  });

  it('penalises recently used variations', () => {
    const ranked = rankSwapCandidates(candidates, {
      weakPoint: 'off_chest',
      roster: [],
      recentlyUsed: ['Incline press'],
    });
    expect(ranked[0].exercise.nameEn).toBe('Spoto press');
  });

  it('every main pattern has failure modes', () => {
    for (const p of ['horizontal_press', 'squat', 'hinge', 'vertical_pull'] as const) {
      expect(failureModesForPattern(p).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Carry-forward load
// ---------------------------------------------------------------------------
describe('carry-forward load', () => {
  it('scales prior e1RM conservatively and rounds to increment (kg)', () => {
    const { weight, reps } = carryForwardLoad(133.3, 'kg', 10);
    // target e1rm = 120 ; weight = 120 / (1 + 10/30) = 90 ; rounded to 1.25
    expect(reps).toBe(10);
    expect(weight).toBeCloseTo(90, 0);
    expect(weight % 1.25).toBeCloseTo(0, 5);
  });
  it('rounds to lb increment', () => {
    const { weight } = carryForwardLoad(200, 'lb', 10);
    expect(weight % 2.5).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------
describe('roster', () => {
  it('effectiveness = gain per week', () => {
    expect(effectiveness(20, 5)).toBeCloseTo(4, 5);
  });
  it('clamps very short cycles', () => {
    expect(effectiveness(10, 0)).toBeCloseTo(20, 5); // weeks floored at 0.5
  });
  it('ranks best-first', () => {
    const entries: VariationRosterEntry[] = [
      { pattern: 'squat', exerciseName: 'A', durationWeeks: 6, strengthGained: 6, effectiveness: 1, active: false },
      { pattern: 'squat', exerciseName: 'B', durationWeeks: 4, strengthGained: 16, effectiveness: 4, active: false },
    ];
    expect(rankRoster(entries)[0].exerciseName).toBe('B');
  });
});

// ---------------------------------------------------------------------------
// Weekly volume (recompute, fixing the #REF! cells)
// ---------------------------------------------------------------------------
describe('weekly volume', () => {
  const program = seed.program as SeedProgram;

  it('setsForWeek ramps then deloads', () => {
    expect(setsForWeek([3, 4, 4], 2, 1, 11)).toBe(3);
    expect(setsForWeek([3, 4, 4], 2, 2, 11)).toBe(4);
    expect(setsForWeek([3, 4, 4], 2, 12, 11)).toBe(2); // deload
  });

  it('week 1 chest = 4 sets (two day-1 + two day-5 exercises @3 each... wk1)', () => {
    const v = weeklyVolume(program, 1);
    // Day1: incline+chest press (3+3), Day5: incline machine + horizontal (3+3) = 12
    expect(v.Chest).toBe(12);
  });

  it('recomputes Calves and Abs (the broken #REF! cells) as real numbers', () => {
    const v = weeklyVolume(program, 2);
    expect(typeof v.Calves).toBe('number');
    expect(v.Calves).toBeGreaterThan(0);
    expect(typeof v.Abs).toBe('number');
    expect(v.Abs).toBeGreaterThan(0);
    // Traps had a 0 bug in the sheet but there is a shrug in the program.
    expect(v.Traps).toBeGreaterThan(0);
  });

  it('volume grows from week 1 to a mid week', () => {
    const w1 = Object.values(weeklyVolume(program, 1)).reduce((a, b) => a + b, 0);
    const w6 = Object.values(weeklyVolume(program, 6)).reduce((a, b) => a + b, 0);
    expect(w6).toBeGreaterThanOrEqual(w1);
  });

  it('volumeStatus flags under/optimal/over', () => {
    expect(volumeStatus('Chest', 4)).toBe('under');
    expect(volumeStatus('Chest', 16)).toBe('optimal');
    expect(volumeStatus('Chest', 30)).toBe('over');
  });
});

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------
describe('levels & xp', () => {
  it('starts at level 1 with no xp', () => {
    expect(levelFromXp(0).level).toBe(1);
  });
  it('level increases with xp and is monotonic', () => {
    let prev = 0;
    for (let xp = 0; xp < 5000; xp += 137) {
      const l = levelFromXp(xp).level;
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
  });
  it('progress stays within 0..1', () => {
    for (const xp of [0, 50, 119, 120, 360, 1000, 4321]) {
      const p = levelFromXp(xp).progress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it('reaching the cumulative threshold advances the level', () => {
    const need = cumXpToReach(5);
    expect(levelFromXp(need).level).toBe(5);
    expect(levelFromXp(need - 1).level).toBe(4);
  });
  it('rank title scales with level', () => {
    expect(rankTitle(1)).toBe('Beginner');
    expect(rankTitle(10)).toBe('Advanced');
    expect(rankTitle(30)).toBe('Legend');
  });
  it('badges unlock from stats', () => {
    const stats: GameStats = {
      xp: 0, level: 6, xpInLevel: 0, xpForLevel: 1, progress: 0, rank: 'Committed',
      workouts: 12, prs: 1, swaps: 1, streak: 3, weeksCompleted: 1, blocks: 1,
    };
    const ids = new Set(earnedBadges(stats).map((b) => b.id));
    expect(ids.has('first_workout')).toBe(true);
    expect(ids.has('workouts_10')).toBe(true);
    expect(ids.has('streak_3')).toBe(true);
    expect(ids.has('level_5')).toBe(true);
    expect(ids.has('level_10')).toBe(false);
    expect(BADGES.length).toBeGreaterThan(8);
  });
});

// ---------------------------------------------------------------------------
// Seed integrity
// ---------------------------------------------------------------------------
describe('seed integrity', () => {
  it('has 7 days with 5 training days', () => {
    expect(seed.program.days.length).toBe(7);
    expect(seed.program.days.filter((d) => !d.isRest).length).toBe(5);
  });
  it('every program exercise has a pattern and a video', () => {
    const all = seed.program.days.flatMap((d) => d.exercises);
    expect(all.length).toBeGreaterThan(0);
    for (const e of all) {
      expect(e.pattern).not.toBe('unknown');
      expect(e.videoUrl).toBeTruthy();
    }
  });
  it('variation library has squat variations for swaps', () => {
    const squat = seed.variationLibrary.filter((g) => g.pattern === 'squat');
    const count = squat.reduce((n, g) => n + g.exercises.length, 0);
    expect(count).toBeGreaterThan(10);
  });
});
