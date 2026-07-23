import { useState } from 'react';
import { seed } from '../../data/seed';
import {
  useStore,
  getState,
  actions,
  resolveExercise,
  lifecycleForSlot,
  targetSetsForSlot,
  sessionId,
  slotKey,
  TOTAL_WEEKS,
  DELOAD_WEEK,
} from '../../store/store';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { LifeCycleBar, Chip } from '../components';
import { color } from '../theme';

export function Today() {
  const state = useStore();
  const { t, dn, pn, rtl } = useI18n();
  const firstTraining = seed.program.days.find((d) => !d.isRest)?.index ?? 1;
  // Default to the first training day not yet completed this week.
  const [dayIndex, setDayIndex] = useState(() => {
    const st = getState();
    const undone = seed.program.days
      .filter((d) => !d.isRest)
      .find(
        (d) =>
          !st.sessions.some(
            (s) => s.id === sessionId(st.blockNumber, st.weekIndex, d.index) && s.status === 'completed',
          ),
      );
    return undone?.index ?? firstTraining;
  });
  const day = seed.program.days.find((d) => d.index === dayIndex)!;
  const isDeload = state.weekIndex === DELOAD_WEEK;

  const sid = sessionId(state.blockNumber, state.weekIndex, dayIndex);
  const session = state.sessions.find((s) => s.id === sid);

  // Which training days of the CURRENT week are already done.
  const isDayDone = (d: number) =>
    state.sessions.some(
      (s) => s.id === sessionId(state.blockNumber, state.weekIndex, d) && s.status === 'completed',
    );
  const trainingDays = seed.program.days.filter((d) => !d.isRest);
  const weekDoneCount = trainingDays.filter((d) => isDayDone(d.index)).length;
  const weekComplete = weekDoneCount >= trainingDays.length;
  const nextWeek = state.weekIndex < TOTAL_WEEKS ? state.weekIndex + 1 : null;

  return (
    <div className="screen">
      <div className="h1">{t('today_title')}</div>

      {/* Week selector — switch weeks here as you progress */}
      <div className="label mt8">{t('pick_week')}</div>
      <div className="row wrap gap6" style={{ marginTop: 4 }}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
          <Chip
            key={w}
            label={w === DELOAD_WEEK ? t('deload') : `${w}`}
            on={w === state.weekIndex}
            onClick={() => actions.setWeek(w)}
          />
        ))}
      </div>

      {/* Day selector — ✓ marks days already logged this week */}
      <div className="label mt16">{dn('Day', 'اليوم')}</div>
      <div className="row wrap gap6" style={{ marginTop: 4 }}>
        {seed.program.days.map((d) => (
          <Chip
            key={d.index}
            label={`${d.index}${isDayDone(d.index) ? ' ✓' : ''}`}
            on={d.index === dayIndex}
            onClick={() => setDayIndex(d.index)}
          />
        ))}
      </div>
      <div className="dim mt8" style={{ fontWeight: 600 }}>
        {dn(`Day ${day.index} · ${day.nameEn}`, `اليوم ${day.index} · ${day.nameAr}`)}
        {!day.isRest && isDayDone(dayIndex) ? ` · ${t('day_done')} ✓` : ''}
      </div>

      {weekComplete && nextWeek && !isDeload && (
        <button
          className="tappable mt16"
          style={{
            width: '100%',
            background: '#13240a',
            border: `1px solid ${color.alive}`,
            borderRadius: 14,
            padding: 14,
            color: color.alive,
            fontWeight: 700,
            textAlign: rtl ? 'right' : 'left',
          }}
          onClick={() => {
            actions.setWeek(nextWeek);
            setDayIndex(firstTraining);
          }}
        >
          ✓ {t('week_complete', { n: state.weekIndex, m: nextWeek })}
        </button>
      )}

      {day.isRest ? (
        <div className="card mt16 center" style={{ padding: 28 }}>
          <div style={{ fontSize: 44 }}>🛌</div>
          <div className="h2" style={{ marginTop: 8 }}>
            {t('rest_day')}
          </div>
          <div className="dim">{t('rest_day_sub')}</div>
        </div>
      ) : (
        <>
          <div className="col gap12 mt16">
            {day.exercises.map((ex) => {
              const slot = slotKey(dayIndex, ex.order);
              const resolved = resolveExercise(dayIndex, ex.order)!;
              const lc = lifecycleForSlot(slot);
              const sets = targetSetsForSlot(dayIndex, ex.order, state.weekIndex);
              const status = lc?.status ?? 'alive';
              const runway = status === 'ended' ? 1 : status === 'slowing' ? 0.6 : 0.25;
              return (
                <button
                  key={ex.order}
                  className="card2 tappable"
                  style={{ textAlign: rtl ? 'right' : 'left' }}
                  onClick={() => navActions.push({ name: 'exercise', slot })}
                >
                  <div className="row-between">
                    <div className="grow">
                      <div style={{ fontWeight: 700 }}>{resolved.name}</div>
                      <div className="dim" style={{ fontSize: 12 }}>
                        {pn(resolved.pattern)} · {sets} × {resolved.repRange[0]}–{resolved.repRange[1]}
                        {resolved.swapped ? ' · ⇄' : ''}
                      </div>
                    </div>
                    {status === 'ended' && (
                      <span className="tag" style={{ color: color.ended, background: '#2a1418' }}>
                        {t('swap')}
                      </span>
                    )}
                  </div>
                  {lc && lc.series.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <LifeCycleBar runway={runway} status={status} height={6} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="btn btn-primary btn-block mt16"
            onClick={() => navActions.push({ name: 'logger', dayIndex })}
          >
            {session?.status === 'completed'
              ? t('review_workout')
              : session
              ? t('resume_workout')
              : t('start_workout')}
          </button>
        </>
      )}
    </div>
  );
}
