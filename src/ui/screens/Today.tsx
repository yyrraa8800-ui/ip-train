import { useState } from 'react';
import { seed } from '../../data/seed';
import {
  useStore,
  resolveExercise,
  lifecycleForSlot,
  targetSetsForSlot,
  sessionId,
  slotKey,
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
  const [dayIndex, setDayIndex] = useState(firstTraining);
  const day = seed.program.days.find((d) => d.index === dayIndex)!;
  const isDeload = state.weekIndex === DELOAD_WEEK;

  const sid = sessionId(state.blockNumber, state.weekIndex, dayIndex);
  const session = state.sessions.find((s) => s.id === sid);

  return (
    <div className="screen">
      <div className="row-between">
        <div className="h1">{t('today_title')}</div>
        <span className="chip">
          {isDeload ? t('deload') : `${t('week')} ${state.weekIndex}`}
        </span>
      </div>

      <div className="row wrap gap6 mt8">
        {seed.program.days.map((d) => (
          <Chip
            key={d.index}
            label={`${d.index}`}
            on={d.index === dayIndex}
            onClick={() => setDayIndex(d.index)}
          />
        ))}
      </div>
      <div className="dim mt8" style={{ fontWeight: 600 }}>
        {dn(`Day ${day.index} · ${day.nameEn}`, `اليوم ${day.index} · ${day.nameAr}`)}
      </div>

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
