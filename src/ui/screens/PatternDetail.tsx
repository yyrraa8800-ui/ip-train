import type { Pattern } from '../../data/types';
import { useStore, lifecycleForSlot, resolveExercise } from '../../store/store';
import { rosterForPattern, slotsForPattern, patternSummary } from '../../store/selectors';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { Ring, LifeCycleBar, StatusPill } from '../components';
import { color, statusColor } from '../theme';

export function PatternDetail({ pattern }: { pattern: Pattern }) {
  useStore();
  const { t, pn, rtl } = useI18n();
  const summary = patternSummary(pattern);
  const slots = slotsForPattern(pattern);
  const roster = rosterForPattern(pattern);
  const maxEff = Math.max(0.0001, ...roster.map((r) => r.effectiveness));

  return (
    <div className="screen">
      <Header title={pn(pattern)} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="card row" style={{ gap: 16 }}>
          <Ring size={72} stroke={8} progress={summary.level} ringColor={statusColor[summary.status]}>
            <span className="bignum" style={{ fontSize: 18 }}>
              {Math.round(summary.level * 100)}
            </span>
          </Ring>
          <div className="grow">
            <div className="label">{t('level')}</div>
            <StatusPill status={summary.status} label={t(`status_${summary.status}`)} />
            <div className="dim mt8" style={{ fontSize: 13 }}>
              {summary.activeCount} {t('exercises')} · {summary.endedCount} {t('status_ended').toLowerCase()}
            </div>
          </div>
        </div>

        <div className="h2">{t('exercises')}</div>
        <div className="col gap12">
          {slots.map((s) => {
            const resolved = resolveExercise(s.dayIndex, s.order)!;
            const lc = lifecycleForSlot(s.slot);
            const status = lc?.status ?? 'alive';
            const runway = status === 'ended' ? 1 : status === 'slowing' ? 0.6 : 0.25;
            return (
              <button
                key={s.slot}
                className="card2 tappable"
                style={{ textAlign: rtl ? 'right' : 'left' }}
                onClick={() => navActions.push({ name: 'exercise', slot: s.slot })}
              >
                <div className="row-between">
                  <div style={{ fontWeight: 700 }}>{resolved.name}</div>
                  <span className="dot" style={{ background: statusColor[status] }} />
                </div>
                <div className="dim" style={{ fontSize: 12, margin: '2px 0 8px' }}>
                  +{(lc?.strengthGained ?? 0).toFixed(1)} pts · {(lc?.durationWeeks ?? 0).toFixed(1)} {t('weeks')}
                </div>
                <LifeCycleBar runway={runway} status={status} height={6} />
              </button>
            );
          })}
        </div>

        <div className="h2">{t('best_variations')}</div>
        {roster.length === 0 ? (
          <div className="muted-banner">{t('no_roster')}</div>
        ) : (
          <div className="col gap6">
            {roster.map((r) => (
              <div key={r.exerciseName} className="card2">
                <div className="row-between">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {r.exerciseName}
                    {r.active && <span className="tag" style={{ marginInlineStart: 8 }}>active</span>}
                  </div>
                  <div className="num" style={{ fontWeight: 700, color: color.alive }}>
                    {r.effectiveness.toFixed(1)}
                  </div>
                </div>
                <div className="mt8" style={{ height: 6, borderRadius: 6, background: color.surface3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(r.effectiveness / maxEff) * 100}%`,
                      height: '100%',
                      background: color.alive,
                    }}
                  />
                </div>
                <div className="faint mt8" style={{ fontSize: 11 }}>
                  +{r.strengthGained.toFixed(1)} pts / {r.durationWeeks.toFixed(1)} {t('weeks')} = {t('effectiveness')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
