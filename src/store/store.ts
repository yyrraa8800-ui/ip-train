// The application store: local-first state with a tiny pub/sub bound to React
// via useSyncExternalStore. No external state library needed.

import { useSyncExternalStore } from 'react';
import { seed } from '../data/seed';
import type {
  ExerciseLifeCycle,
  LifePoint,
  LoggedExercise,
  Pattern,
  SeedExercise,
  SetEntry,
  Settings,
  VariationRosterEntry,
  WorkoutSession,
} from '../data/types';
import {
  carryForwardLoad,
  evaluateLifeCycle,
  lifePointFromSets,
  rosterEntryFromLifeCycle,
  setsForWeek,
  topSetE1RM,
} from '../engine';
import { loadRaw, saveRaw } from './persist';

// ---------------------------------------------------------------------------
// Derived seed indexes
// ---------------------------------------------------------------------------

export const TOTAL_WEEKS = seed.program.weeks + (seed.program.hasDeload ? 1 : 0);
export const DELOAD_WEEK = seed.program.hasDeload ? TOTAL_WEEKS : -1;

const variationByName = new Map<string, { videoUrl: string | null; weakPoints: string[] }>();
for (const g of seed.variationLibrary)
  for (const e of g.exercises)
    if (!variationByName.has(e.nameEn))
      variationByName.set(e.nameEn, { videoUrl: e.videoUrl, weakPoints: e.weakPoints });

export function seedExerciseFor(dayIndex: number, order: number): SeedExercise | undefined {
  const day = seed.program.days.find((d) => d.index === dayIndex);
  return day?.exercises.find((e) => e.order === order);
}

export function slotKey(dayIndex: number, order: number): string {
  return `${dayIndex}.${order}`;
}

export interface ResolvedExercise {
  dayIndex: number;
  order: number;
  slot: string;
  name: string;
  defaultName: string;
  pattern: Pattern;
  muscleKey: string;
  isIsolation: boolean;
  videoUrl: string | null;
  weakPoints: string[];
  repRange: [number, number];
  restSeconds: [number, number];
  swapped: boolean;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface SwapLogEntry {
  slot: string;
  from: string;
  to: string;
  week: number;
  date: string;
}

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  settings: Settings;
  blockNumber: number;
  blockStartDate: string;
  weekIndex: number;
  sessions: WorkoutSession[];
  overrides: Record<string, string>; // slot -> exercise name
  cycleStartWeek: Record<string, number>; // slot -> week the variation started
  carryWeights: Record<string, number>; // slot -> prefill weight
  roster: VariationRosterEntry[];
  swapLog: SwapLogEntry[];
}

const DEFAULT_SETTINGS: Settings = {
  units: 'kg',
  language: 'en',
  notifications: true,
  startWeekday: 1,
};

function freshState(): AppState {
  return {
    hydrated: false,
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    blockNumber: 1,
    blockStartDate: new Date().toISOString(),
    weekIndex: 1,
    sessions: [],
    overrides: {},
    cycleStartWeek: {},
    carryWeights: {},
    roster: [],
    swapLog: [],
  };
}

let state: AppState = freshState();
const listeners = new Set<() => void>();

function commit(next: Partial<AppState>) {
  state = { ...state, ...next };
  if (state.hydrated) persist();
  listeners.forEach((l) => l());
}

function persist() {
  const { hydrated: _h, ...rest } = state;
  saveRaw({ version: 1, ...rest });
}

export function hydrate() {
  const raw = loadRaw<Partial<AppState> & { version?: number }>();
  if (raw) {
    state = {
      ...freshState(),
      ...raw,
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
      hydrated: true,
    };
  } else {
    state = { ...freshState(), hydrated: true };
  }
  listeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// React binding
// ---------------------------------------------------------------------------

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}
export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function getState(): AppState {
  return state;
}

// ---------------------------------------------------------------------------
// Resolution helpers
// ---------------------------------------------------------------------------

export function resolveExercise(dayIndex: number, order: number): ResolvedExercise | undefined {
  const base = seedExerciseFor(dayIndex, order);
  if (!base) return undefined;
  const slot = slotKey(dayIndex, order);
  const overrideName = state.overrides[slot];
  const name = overrideName ?? base.nameEn;
  const meta = overrideName ? variationByName.get(overrideName) : undefined;
  return {
    dayIndex,
    order,
    slot,
    name,
    defaultName: base.nameEn,
    pattern: base.pattern,
    muscleKey: base.muscleKey,
    isIsolation: base.isIsolation,
    videoUrl: meta?.videoUrl ?? base.videoUrl,
    weakPoints: meta?.weakPoints ?? base.weakPoints,
    repRange: base.repRange,
    restSeconds: base.restSeconds,
    swapped: Boolean(overrideName),
  };
}

export function targetSetsForSlot(dayIndex: number, order: number, week: number): number {
  const base = seedExerciseFor(dayIndex, order);
  if (!base) return 3;
  return setsForWeek(base.setsByWeek, base.deloadSets, week, seed.program.weeks);
}

export function sessionId(blockNumber: number, week: number, dayIndex: number): string {
  return `b${blockNumber}-w${week}-d${dayIndex}`;
}

/** The most recent completed session for this slot's day, for ghost targets. */
export function lastCompletedForSlot(slot: string): LoggedExercise | undefined {
  const [dayIndex] = slot.split('.').map(Number);
  const sessions = state.sessions
    .filter((s) => s.dayIndex === dayIndex && s.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sessions) {
    const ex = s.exercises.find((e) => `${dayIndex}.${e.order}` === slot);
    if (ex && ex.sets.some((set) => !set.isWarmup && set.weight > 0)) return ex;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const actions = {
  completeOnboarding(settings: Partial<Settings>) {
    commit({ onboarded: true, settings: { ...state.settings, ...settings } });
  },

  setSettings(patch: Partial<Settings>) {
    commit({ settings: { ...state.settings, ...patch } });
  },

  setWeek(week: number) {
    commit({ weekIndex: Math.max(1, Math.min(TOTAL_WEEKS, week)) });
  },

  /** Get or lazily create the session for the current week + a given day. */
  startSession(dayIndex: number): WorkoutSession {
    const id = sessionId(state.blockNumber, state.weekIndex, dayIndex);
    const existing = state.sessions.find((s) => s.id === id);
    if (existing) return existing;

    const day = seed.program.days.find((d) => d.index === dayIndex);
    const exercises: LoggedExercise[] = (day?.exercises ?? []).map((base) => {
      const resolved = resolveExercise(dayIndex, base.order)!;
      const slot = slotKey(dayIndex, base.order);
      const n = targetSetsForSlot(dayIndex, base.order, state.weekIndex);
      const prefill =
        state.carryWeights[slot] ??
        topWorkingWeight(lastCompletedForSlot(slot)) ??
        0;
      const sets: SetEntry[] = Array.from({ length: n }, () => ({
        weight: prefill,
        reps: 0,
        isWarmup: false,
        done: false,
      }));
      return {
        order: base.order,
        exerciseName: resolved.name,
        pattern: resolved.pattern,
        muscleKey: resolved.muscleKey,
        sets,
      };
    });

    const session: WorkoutSession = {
      id,
      date: new Date().toISOString(),
      dayIndex,
      weekIndex: state.weekIndex,
      status: 'in_progress',
      exercises,
    };
    commit({ sessions: [...state.sessions, session] });
    return session;
  },

  updateExerciseSets(sessionIdStr: string, order: number, sets: SetEntry[]) {
    const sessions = state.sessions.map((s) => {
      if (s.id !== sessionIdStr) return s;
      return {
        ...s,
        exercises: s.exercises.map((e) =>
          e.order === order ? { ...e, sets } : e,
        ),
      };
    });
    commit({ sessions });
    recomputeRatings(sessionIdStr);
  },

  setExerciseNote(sessionIdStr: string, order: number, note: string) {
    const sessions = state.sessions.map((s) =>
      s.id !== sessionIdStr
        ? s
        : {
            ...s,
            exercises: s.exercises.map((e) =>
              e.order === order ? { ...e, note } : e,
            ),
          },
    );
    commit({ sessions });
  },

  overrideRating(sessionIdStr: string, order: number, rating: 0 | 1) {
    const sessions = state.sessions.map((s) =>
      s.id !== sessionIdStr
        ? s
        : {
            ...s,
            exercises: s.exercises.map((e) =>
              e.order === order
                ? { ...e, rating, ratingOverridden: true }
                : e,
            ),
          },
    );
    commit({ sessions });
  },

  completeSession(sessionIdStr: string) {
    const sessions = state.sessions.map((s) =>
      s.id === sessionIdStr ? { ...s, status: 'completed' as const } : s,
    );
    commit({ sessions });
    recomputeRatings(sessionIdStr);
  },

  setSessionNotes(sessionIdStr: string, notes: string) {
    commit({
      sessions: state.sessions.map((s) => (s.id === sessionIdStr ? { ...s, notes } : s)),
    });
  },

  /** Accept a swap: end the old variation's cycle (write a roster entry), point
   *  the slot at the new variation, and seed its carry-forward starting load. */
  acceptSwap(slot: string, newName: string, carryWeight: number) {
    const [dayIndex, order] = slot.split('.').map(Number);
    const resolved = resolveExercise(dayIndex, order);
    if (!resolved) return;

    // Close the old cycle into the roster.
    const lc = lifecycleForSlot(slot);
    if (lc) {
      const entry = rosterEntryFromLifeCycle({ ...lc, status: 'ended', endDate: new Date().toISOString() });
      const roster = [...state.roster.filter((r) => !(r.exerciseName === lc.exerciseName && r.active)), entry];
      const swapLog: SwapLogEntry[] = [
        ...state.swapLog,
        { slot, from: resolved.name, to: newName, week: state.weekIndex, date: new Date().toISOString() },
      ];
      commit({
        roster,
        swapLog,
        overrides: { ...state.overrides, [slot]: newName },
        cycleStartWeek: { ...state.cycleStartWeek, [slot]: state.weekIndex },
        carryWeights: { ...state.carryWeights, [slot]: carryWeight },
      });
    } else {
      commit({
        overrides: { ...state.overrides, [slot]: newName },
        cycleStartWeek: { ...state.cycleStartWeek, [slot]: state.weekIndex },
        carryWeights: { ...state.carryWeights, [slot]: carryWeight },
      });
    }
  },

  /** End the ramp: archive cycles, then start a new block at week 1, rotating in
   *  the highest-effectiveness variation for any slot whose cycle ended. */
  generateNextBlock() {
    const now = new Date().toISOString();
    const archived: VariationRosterEntry[] = [];
    const overrides = { ...state.overrides };
    const carryWeights = { ...state.carryWeights };
    const units = state.settings.units;

    for (const day of seed.program.days) {
      if (day.isRest) continue;
      for (const base of day.exercises) {
        const slot = slotKey(day.index, base.order);
        const lc = lifecycleForSlot(slot);
        if (lc && lc.series.length > 0) archived.push(rosterEntryFromLifeCycle({ ...lc, endDate: now }));
        // Rotate ended slots toward your best proven variation for the pattern.
        if (lc && lc.status === 'ended') {
          const next = bestRotationFor(base.pattern, lc.exerciseName);
          if (next) {
            overrides[slot] = next;
            carryWeights[slot] = carryForwardLoad(lc.currentTopSetE1RM || lc.startTopSetE1RM, units).weight;
          }
        }
      }
    }

    commit({
      blockNumber: state.blockNumber + 1,
      blockStartDate: now,
      weekIndex: 1,
      roster: [...state.roster.map((r) => ({ ...r, active: false })), ...archived],
      overrides,
      carryWeights,
      cycleStartWeek: {},
    });
  },

  resetAll() {
    state = { ...freshState(), hydrated: true, onboarded: false };
    persist();
    listeners.forEach((l) => l());
  },
};

// ---------------------------------------------------------------------------
// Lifecycle derivation (per slot, from completed/in-progress sessions)
// ---------------------------------------------------------------------------

export function slotSeries(slot: string): LifePoint[] {
  const [dayIndex] = slot.split('.').map(Number);
  const startWeek = state.cycleStartWeek[slot] ?? 1;
  const sessions = state.sessions
    .filter(
      (s) =>
        s.dayIndex === dayIndex &&
        s.weekIndex >= startWeek &&
        s.exercises.some((e) => `${dayIndex}.${e.order}` === slot),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: LifePoint[] = [];
  let prev: LifePoint | undefined;
  for (const s of sessions) {
    const ex = s.exercises.find(
      (e) => `${dayIndex}.${e.order}` === slot,
    );
    if (!ex) continue;
    const hasWorking = ex.sets.some((set) => !set.isWarmup && set.weight > 0 && set.reps > 0);
    if (!hasWorking) continue;
    const p = lifePointFromSets(s.date, ex.sets, prev);
    if (ex.ratingOverridden && (ex.rating === 0 || ex.rating === 1)) p.rating = ex.rating;
    points.push(p);
    prev = p;
  }
  return points;
}

export function lifecycleForSlot(slot: string): ExerciseLifeCycle | undefined {
  const resolved = (() => {
    const [d, o] = slot.split('.').map(Number);
    return resolveExercise(d, o);
  })();
  if (!resolved) return undefined;
  const series = slotSeries(slot);
  const ev = evaluateLifeCycle(series);
  return {
    id: slot,
    exerciseName: resolved.name,
    pattern: resolved.pattern,
    startDate: series[0]?.date ?? state.blockStartDate,
    status: ev.status,
    startTopSetE1RM: ev.startE1RM,
    currentTopSetE1RM: ev.currentE1RM,
    strengthGained: ev.strengthGained,
    durationWeeks: ev.durationWeeks,
    series,
  };
}

// ---------------------------------------------------------------------------
// small utils
// ---------------------------------------------------------------------------

/** Pick the best replacement variation for a pattern when starting a new block:
 *  the user's highest-effectiveness proven variation, else a fresh library
 *  variation not currently in use. */
function bestRotationFor(pattern: Pattern, currentName: string): string | undefined {
  const inUse = new Set(Object.values(state.overrides));
  const proven = state.roster
    .filter((r) => r.pattern === pattern && r.exerciseName !== currentName)
    .sort((a, b) => b.effectiveness - a.effectiveness);
  if (proven.length) return proven[0].exerciseName;
  for (const g of seed.variationLibrary) {
    if (g.pattern !== pattern) continue;
    for (const e of g.exercises) {
      if (e.nameEn !== currentName && !inUse.has(e.nameEn)) return e.nameEn;
    }
  }
  return undefined;
}

function topWorkingWeight(ex: LoggedExercise | undefined): number | undefined {
  if (!ex) return undefined;
  const working = ex.sets.filter((s) => !s.isWarmup && s.weight > 0);
  if (!working.length) return undefined;
  return Math.max(...working.map((s) => s.weight));
}

function recomputeRatings(sessionIdStr: string) {
  const sess = state.sessions.find((s) => s.id === sessionIdStr);
  if (!sess) return;
  const sessions = state.sessions.map((s) => {
    if (s.id !== sessionIdStr) return s;
    return {
      ...s,
      exercises: s.exercises.map((e) => {
        if (e.ratingOverridden) return e;
        const slot = `${s.dayIndex}.${e.order}`;
        const series = priorSeriesForSlot(slot, s.date);
        const prevE1 = series.length ? series[series.length - 1].e1rm : 0;
        const curE1 = topSetE1RM(e.sets);
        const rating: 0 | 1 = curE1 <= 0 ? 0 : curE1 >= prevE1 ? 1 : 0;
        return { ...e, rating };
      }),
    };
  });
  state = { ...state, sessions };
  if (state.hydrated) persist();
  listeners.forEach((l) => l());
}

function priorSeriesForSlot(slot: string, beforeDate: string): LifePoint[] {
  return slotSeries(slot).filter((p) => p.date < beforeDate);
}
