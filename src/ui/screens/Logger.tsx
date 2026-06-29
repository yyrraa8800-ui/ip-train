import { useEffect, useState } from 'react';
import { seed } from '../../data/seed';
import {
  useStore,
  actions,
  resolveExercise,
  lifecycleForSlot,
  lastCompletedForSlot,
  slotKey,
  sessionId,
} from '../../store/store';
import type { SetEntry } from '../../data/types';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { Stepper, RestTimer, haptic, LifeCycleBar } from '../components';
import { InfoButton } from '../InfoButton';
import { Celebrate, type Celebration } from '../Celebrate';
import { gameProgress } from '../../store/selectors';
import { color, statusColor } from '../theme';
import { Tuning } from '../../engine';

export function Logger({ dayIndex }: { dayIndex: number }) {
  const state = useStore();
  const { t, dn, rtl } = useI18n();
  const day = seed.program.days.find((d) => d.index === dayIndex)!;
  const inc = Tuning.increments[state.settings.units];
  const [rest, setRest] = useState<{ seconds: number } | null>(null);
  const [rirOn, setRirOn] = useState<Set<number>>(new Set());
  const [celebrate, setCelebrate] = useState<Celebration | null>(null);
  const toggleRir = (order: number) =>
    setRirOn((prev) => {
      const next = new Set(prev);
      next.has(order) ? next.delete(order) : next.add(order);
      return next;
    });

  // Ensure the session exists.
  useEffect(() => {
    actions.startSession(dayIndex);
  }, [dayIndex, state.weekIndex, state.blockNumber]);

  const sid = sessionId(state.blockNumber, state.weekIndex, dayIndex);
  const session = state.sessions.find((s) => s.id === sid);
  if (!session) return null;

  const warmups = computeWarmupPlan(day);

  function updateSet(order: number, i: number, patch: Partial<SetEntry>) {
    const ex = session!.exercises.find((e) => e.order === order);
    if (!ex) return;
    const sets = ex.sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    actions.updateExerciseSets(session!.id, order, sets);
  }
  function addSet(order: number, warm = false) {
    const ex = session!.exercises.find((e) => e.order === order);
    if (!ex) return;
    const last = ex.sets[ex.sets.length - 1];
    const sets = [...ex.sets, { weight: last?.weight ?? 0, reps: 0, isWarmup: warm, done: false }];
    actions.updateExerciseSets(session!.id, order, sets);
  }
  function markDone(order: number, i: number, restSeconds: number) {
    const ex = session!.exercises.find((e) => e.order === order);
    if (!ex) return;
    const wasDone = ex.sets[i].done;
    updateSet(order, i, { done: !wasDone });
    haptic();
    if (!wasDone && !ex.sets[i].isWarmup) setRest({ seconds: restSeconds });
  }

  const allLogged = session.exercises.every((e) =>
    e.sets.some((s) => !s.isWarmup && s.weight > 0 && s.reps > 0),
  );

  return (
    <div className="screen">
      <Header title={dn(day.nameEn, day.nameAr)} onBack={() => navActions.pop()} />
      <div className="row-between" style={{ padding: '0 16px 8px' }}>
        <div className="dim">
          {t('week')} {state.weekIndex} · {session.exercises.length} {t('exercises')}
        </div>
        <button
          className="chip"
          style={{ color: color.ended, borderColor: '#4a2630' }}
          onClick={() => {
            if (confirm(t('clear_workout_confirm'))) {
              actions.clearSession(session.id);
              actions.startSession(dayIndex);
            }
          }}
        >
          ↺ {t('clear_workout')}
        </button>
      </div>

      <div className="col gap12" style={{ padding: '0 16px' }}>
        {session.exercises.map((ex) => {
          const slot = slotKey(dayIndex, ex.order);
          const resolved = resolveExercise(dayIndex, ex.order)!;
          const lc = lifecycleForSlot(slot);
          const ghost = lastCompletedForSlot(slot);
          const restSeconds = Math.round((resolved.restSeconds[0] + resolved.restSeconds[1]) / 2);
          const wp = warmups[ex.order];

          return (
            <div key={ex.order} className="card">
              <div className="row-between">
                <div className="grow" style={{ textAlign: rtl ? 'right' : 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{resolved.name}</div>
                  <div className="dim" style={{ fontSize: 12 }}>
                    {resolved.repRange[0]}–{resolved.repRange[1]} {t('reps')} · {state.settings.units}
                  </div>
                </div>
                <div className="row gap6">
                  {resolved.videoUrl && (
                    <button className="chip" onClick={() => window.open(resolved.videoUrl!, '_blank')}>
                      ▶ {t('watch')}
                    </button>
                  )}
                  <button
                    className="chip"
                    title={t('change_exercise')}
                    onClick={() => navActions.push({ name: 'change', slot })}
                  >
                    🔁
                  </button>
                </div>
              </div>

              {lc && lc.status === 'ended' && (
                <button
                  className="tappable mt8"
                  style={{
                    width: '100%',
                    textAlign: rtl ? 'right' : 'left',
                    background: '#241114',
                    border: `1px solid ${color.ended}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: color.ended,
                    fontWeight: 700,
                  }}
                  onClick={() => navActions.push({ name: 'swap', slot })}
                >
                  🔴 {t('cycle_ended_choose')} ›
                </button>
              )}

              {wp && (
                <div className="muted-banner mt8" style={{ fontSize: 12 }}>
                  🔥 {t('warmup_guidance')}: {wp}
                </div>
              )}

              {ghost && (
                <div className="faint mt8" style={{ fontSize: 12 }}>
                  {t('ghost_hint')}: {ghostSummary(ghost.sets)}
                </div>
              )}

              <div className="col gap6 mt8">
                {ex.sets.map((s, i) => (
                  <div key={i}>
                    <div className="row" style={{ gap: 8 }}>
                      <button
                        className="chip"
                        style={{ width: 32, justifyContent: 'center', padding: '6px 0', flex: 'none' }}
                        onClick={() => updateSet(ex.order, i, { isWarmup: !s.isWarmup })}
                        title="toggle warm-up"
                      >
                        {s.isWarmup ? 'W' : i + 1 - ex.sets.slice(0, i).filter((x) => x.isWarmup).length}
                      </button>
                      <div className="col" style={{ flex: 1 }}>
                        <div className="label" style={{ fontSize: 9 }}>
                          {t('weight')}
                        </div>
                        <Stepper value={s.weight} step={inc} onChange={(v) => updateSet(ex.order, i, { weight: v })} />
                      </div>
                      <div className="col" style={{ flex: 1 }}>
                        <div className="label" style={{ fontSize: 9 }}>
                          {t('reps')}
                        </div>
                        <Stepper value={s.reps} step={1} onChange={(v) => updateSet(ex.order, i, { reps: v })} />
                      </div>
                      <button
                        className="chip"
                        style={{
                          width: 42,
                          height: 52,
                          flex: 'none',
                          justifyContent: 'center',
                          background: s.done ? color.alive : undefined,
                          color: s.done ? '#0b1206' : undefined,
                          borderColor: s.done ? color.alive : undefined,
                          fontSize: 20,
                        }}
                        onClick={() => markDone(ex.order, i, restSeconds)}
                      >
                        ✓
                      </button>
                    </div>
                    {rirOn.has(ex.order) && !s.isWarmup && (
                      <div className="row gap6" style={{ marginTop: 4, paddingInlineStart: 40 }}>
                        <span className="label" style={{ fontSize: 9 }}>RIR</span>
                        {[null, 0, 1, 2, 3].map((v) => {
                          const sel = v === null ? s.rir == null : s.rir === v;
                          return (
                            <button
                              key={String(v)}
                              className={`chip ${sel ? 'chip-on' : ''}`}
                              style={{ padding: '2px 9px', fontSize: 12 }}
                              onClick={() => updateSet(ex.order, i, { rir: v === null ? undefined : v })}
                            >
                              {v === null ? '—' : v}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="row-between mt8">
                <div className="row gap6">
                  <button className="chip" onClick={() => addSet(ex.order)}>
                    ＋ {t('add_set')}
                  </button>
                  <button
                    className={`chip ${rirOn.has(ex.order) ? 'chip-on' : ''}`}
                    onClick={() => toggleRir(ex.order)}
                  >
                    RIR
                  </button>
                  <InfoButton topic="rir" />
                </div>
                <RatingChip
                  rating={ex.rating}
                  onToggle={() =>
                    actions.overrideRating(session.id, ex.order, ex.rating === 1 ? 0 : 1)
                  }
                />
              </div>

              {lc && lc.series.length > 0 && (
                <div className="mt8">
                  <LifeCycleBar runway={lc.status === 'ended' ? 1 : lc.status === 'slowing' ? 0.6 : 0.25} status={lc.status} height={6} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16 }}>
        <button
          className="btn btn-primary btn-block"
          disabled={!allLogged}
          onClick={() => {
            const before = gameProgress();
            actions.completeSession(session.id);
            const after = gameProgress();
            setCelebrate({
              xpGained: Math.max(0, after.xp - before.xp),
              leveledTo: after.level > before.level ? after.level : undefined,
              prs: Math.max(0, after.prs - before.prs),
              rank: after.rank,
            });
          }}
        >
          {t('finish_workout')}
        </button>
      </div>

      {celebrate && (
        <Celebrate
          data={celebrate}
          onClose={() => {
            setCelebrate(null);
            navActions.pop();
          }}
        />
      )}

      {rest && (
        <RestTimer
          seconds={rest.seconds}
          beep={state.settings.notifications}
          label={t('rest_timer')}
          onDone={() => {}}
          onClose={() => setRest(null)}
        />
      )}
    </div>
  );
}

function RatingChip({ rating, onToggle }: { rating?: 0 | 1; onToggle: () => void }) {
  const on = rating === 1;
  return (
    <button
      className="chip"
      onClick={onToggle}
      style={{
        background: on ? '#13240a' : '#241114',
        borderColor: on ? statusColor.alive : statusColor.ended,
        color: on ? statusColor.alive : statusColor.ended,
      }}
    >
      {on ? '↑ 1' : '· 0'}
    </button>
  );
}

function ghostSummary(sets: SetEntry[]): string {
  const working = sets.filter((s) => !s.isWarmup && s.weight > 0);
  if (!working.length) return '—';
  const w = Math.max(...working.map((s) => s.weight));
  const reps = working.map((s) => s.reps).join(',');
  return `${w} × ${reps}`;
}

const SMALL_MUSCLES = new Set(['Forearms', 'Traps', 'Abs', 'Calves', 'Side delts', 'Rear delts']);

function computeWarmupPlan(day: { exercises: { order: number; muscleKey: string }[] }): Record<number, string> {
  const seen = new Set<string>();
  const plan: Record<number, string> = {};
  for (const ex of day.exercises) {
    const small = SMALL_MUSCLES.has(ex.muscleKey);
    if (small) plan[ex.order] = '1 × ~75%';
    else if (!seen.has(ex.muscleKey)) plan[ex.order] = '2 × 50% · 75%';
    else plan[ex.order] = '1 × ~75%';
    seen.add(ex.muscleKey);
  }
  return plan;
}
