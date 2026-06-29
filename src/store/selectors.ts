// Pure derived views over the store, used by the UI.

import { seed } from '../data/seed';
import type {
  ExerciseLifeCycle,
  LifeStatus,
  Pattern,
  SeedVariation,
  VariationRosterEntry,
} from '../data/types';
import { MAIN_PATTERNS } from '../data/types';
import {
  patternLevel as patternLevelFromRoster,
  rankRoster,
  rosterEntryFromLifeCycle,
  weeklyVolume,
  topSetE1RM,
  levelFromXp,
  rankTitle,
  XP,
  type GameStats,
} from '../engine';
import {
  getState,
  lifecycleForSlot,
  resolveExercise,
  slotKey,
} from './store';

export interface SlotRef {
  dayIndex: number;
  order: number;
  slot: string;
}

export function allSlots(): SlotRef[] {
  const out: SlotRef[] = [];
  for (const day of seed.program.days) {
    if (day.isRest) continue;
    for (const ex of day.exercises) out.push({ dayIndex: day.index, order: ex.order, slot: slotKey(day.index, ex.order) });
  }
  return out;
}

export function activeCycles(): ExerciseLifeCycle[] {
  return allSlots()
    .map((s) => lifecycleForSlot(s.slot))
    .filter((lc): lc is ExerciseLifeCycle => Boolean(lc) && (lc as ExerciseLifeCycle).series.length > 0);
}

/** Archived roster + the current (active) slot cycles, for leaderboards/levels. */
export function combinedRoster(): VariationRosterEntry[] {
  const active = activeCycles().map((lc) => rosterEntryFromLifeCycle(lc));
  return [...getState().roster, ...active];
}

export interface PatternSummary {
  pattern: Pattern;
  level: number; // 0..1
  status: LifeStatus;
  activeCount: number;
  endedCount: number;
}

const STATUS_RANK: Record<LifeStatus, number> = { alive: 0, slowing: 1, ended: 2 };

export function patternSummary(pattern: Pattern): PatternSummary {
  const roster = combinedRoster();
  const cycles = activeCycles().filter((c) => c.pattern === pattern);
  let worst: LifeStatus = 'alive';
  for (const c of cycles) if (STATUS_RANK[c.status] > STATUS_RANK[worst]) worst = c.status;
  return {
    pattern,
    level: patternLevelFromRoster(roster, pattern),
    status: worst,
    activeCount: slotsForPattern(pattern).length,
    endedCount: cycles.filter((c) => c.status === 'ended').length,
  };
}

export function allMainSummaries(): PatternSummary[] {
  return MAIN_PATTERNS.map(patternSummary);
}

export function rosterForPattern(pattern: Pattern): VariationRosterEntry[] {
  // Merge active + archived, dedupe by name keeping the best effectiveness.
  const all = combinedRoster().filter((r) => r.pattern === pattern);
  const byName = new Map<string, VariationRosterEntry>();
  for (const r of all) {
    const existing = byName.get(r.exerciseName);
    if (!existing || r.effectiveness > existing.effectiveness) byName.set(r.exerciseName, r);
  }
  return rankRoster([...byName.values()]);
}

export function currentVolume(): Record<string, number> {
  return weeklyVolume(seed.program, getState().weekIndex);
}

/** Library variations for a pattern (flattened, deduped by name). */
export function libraryForPattern(pattern: Pattern): SeedVariation[] {
  const out: SeedVariation[] = [];
  const seen = new Set<string>();
  for (const g of seed.variationLibrary) {
    if (g.pattern !== pattern) continue;
    for (const e of g.exercises) {
      if (seen.has(e.nameEn)) continue;
      seen.add(e.nameEn);
      out.push(e);
    }
  }
  return out;
}

/** Names used recently (current overrides + swap log targets) for a pattern. */
export function recentlyUsedFor(pattern: Pattern): string[] {
  const state = getState();
  const names = new Set<string>();
  for (const s of allSlots()) {
    const r = resolveExercise(s.dayIndex, s.order);
    if (r && r.pattern === pattern) names.add(r.name);
  }
  for (const log of state.swapLog) names.add(log.to);
  return [...names];
}

export function slotsForPattern(pattern: Pattern): SlotRef[] {
  return allSlots().filter((s) => {
    const r = resolveExercise(s.dayIndex, s.order);
    return r?.pattern === pattern;
  });
}

// ---------------------------------------------------------------------------
// Gamification — all derived from completed sessions, so it always matches data.
// ---------------------------------------------------------------------------

export function gameProgress(): GameStats {
  const state = getState();
  const completed = state.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));

  let xp = 0;
  let prs = 0;
  const bestByExercise = new Map<string, number>();

  for (const s of completed) {
    xp += XP.perWorkout;
    for (const ex of s.exercises) {
      const working = ex.sets.filter((set) => !set.isWarmup && set.weight > 0 && set.reps > 0);
      if (!working.length) continue;
      xp += XP.perWorkingSet * working.length;
      if (ex.rating === 1) xp += XP.perProgression;
      const e1 = topSetE1RM(ex.sets);
      const prev = bestByExercise.get(ex.exerciseName);
      if (prev != null && e1 > prev + 0.01) {
        prs += 1;
        xp += XP.perPR;
      }
      if (prev == null || e1 > prev) bestByExercise.set(ex.exerciseName, e1);
    }
  }

  const swaps = state.swapLog.length;
  xp += XP.perSwap * swaps;

  // weeks fully completed (all training days done in a given block+week)
  const trainingDays = seed.program.days.filter((d) => !d.isRest).length;
  const byWeek = new Map<string, Set<number>>();
  for (const s of completed) {
    const k = `${s.id.split('-d')[0]}`; // bN-wW
    if (!byWeek.has(k)) byWeek.set(k, new Set());
    byWeek.get(k)!.add(s.dayIndex);
  }
  let weeksCompleted = 0;
  for (const set of byWeek.values()) if (set.size >= trainingDays) weeksCompleted += 1;
  xp += XP.perWeek * weeksCompleted;

  const streak = computeStreak(completed.map((s) => s.date));
  const li = levelFromXp(xp);

  return {
    xp,
    level: li.level,
    xpInLevel: li.xpInLevel,
    xpForLevel: li.xpForLevel,
    progress: li.progress,
    rank: rankTitle(li.level),
    workouts: completed.length,
    prs,
    swaps,
    streak,
    weeksCompleted,
    blocks: state.blockNumber,
  };
}

/** Current streak of completed workouts; a gap > 4 days (or none in the last 8)
 *  resets it — so stepping away cleanly resets the streak. */
function computeStreak(datesIso: string[]): number {
  if (!datesIso.length) return 0;
  const days = [...new Set(datesIso.map((d) => Math.floor(new Date(d).getTime() / 86400000)))].sort(
    (a, b) => a - b,
  );
  const today = Math.floor(Date.now() / 86400000);
  if (today - days[days.length - 1] > 8) return 0;
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] - days[i - 1] <= 4) streak += 1;
    else break;
  }
  return streak;
}

/** Slots whose current variation has an ended life cycle (swap suggested). */
export function endedSlots(): { ref: SlotRef; lc: ExerciseLifeCycle }[] {
  const out: { ref: SlotRef; lc: ExerciseLifeCycle }[] = [];
  for (const ref of allSlots()) {
    const lc = lifecycleForSlot(ref.slot);
    if (lc && lc.status === 'ended') out.push({ ref, lc });
  }
  return out;
}
