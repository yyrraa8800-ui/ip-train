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

/** Slots whose current variation has an ended life cycle (swap suggested). */
export function endedSlots(): { ref: SlotRef; lc: ExerciseLifeCycle }[] {
  const out: { ref: SlotRef; lc: ExerciseLifeCycle }[] = [];
  for (const ref of allSlots()) {
    const lc = lifecycleForSlot(ref.slot);
    if (lc && lc.status === 'ended') out.push({ ref, lc });
  }
  return out;
}
