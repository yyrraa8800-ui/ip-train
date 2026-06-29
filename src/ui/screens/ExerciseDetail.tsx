import {
  lifecycleForSlot,
  resolveExercise,
  slotSeries,
} from '../../store/store';
import { useStore } from '../../store/store';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { LifeCycleBar, Sparkline, StatusPill } from '../components';
import { InfoButton } from '../InfoButton';
import { color, statusColor } from '../theme';

export function ExerciseDetail({ slot }: { slot: string }) {
  useStore();
  const { t, pn, rtl } = useI18n();
  const [dayIndex, order] = slot.split('.').map(Number);
  const resolved = resolveExercise(dayIndex, order);
  if (!resolved) return null;
  const lc = lifecycleForSlot(slot);
  const series = slotSeries(slot);
  const status = lc?.status ?? 'alive';
  const runway = status === 'ended' ? 1 : status === 'slowing' ? 0.6 : 0.25;

  return (
    <div className="screen">
      <Header title={resolved.name} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="row-between">
          <div className="dim">{pn(resolved.pattern)}</div>
          <StatusPill status={status} label={t(`status_${status}`)} />
        </div>

        {resolved.videoUrl && (
          <button className="btn mt8 btn-block" onClick={() => window.open(resolved.videoUrl!, '_blank')}>
            ▶ {t('watch')}
          </button>
        )}

        <div className="card mt16">
          <div className="row gap6" style={{ alignItems: 'center' }}>
            <div className="label">{t('life_cycle')}</div>
            <InfoButton topic="life_cycle" />
          </div>
          <div className="mt8">
            <LifeCycleBar runway={runway} status={status} height={10} />
          </div>
          <div className="row-between mt16">
            <Metric label={t('strength_gained')} value={`+${(lc?.strengthGained ?? 0).toFixed(1)}`} unit="pts" color={statusColor.alive} />
            <Metric label={t('duration')} value={`${(lc?.durationWeeks ?? 0).toFixed(1)}`} unit={t('weeks')} />
            <div className="col" style={{ alignItems: rtl ? 'flex-start' : 'flex-end' }}>
              <div className="row gap6" style={{ alignItems: 'center' }}>
                <div className="label">{t('e1rm')}</div>
                <InfoButton topic="strength_score" />
              </div>
              <Sparkline values={series.map((p) => p.e1rm)} width={110} height={36} stroke={statusColor[status]} />
            </div>
          </div>
        </div>

        {status === 'ended' && (
          <button className="btn btn-primary btn-block mt16" onClick={() => navActions.push({ name: 'swap', slot })}>
            🔁 {t('swap_title')}
          </button>
        )}

        <div className="h2">{t('history')}</div>
        {series.length === 0 ? (
          <div className="muted-banner">{t('no_history')}</div>
        ) : (
          <div className="col gap6">
            {series
              .slice()
              .reverse()
              .map((p, i) => (
                <div key={i} className="card2 row-between">
                  <div className="dim" style={{ fontSize: 13 }}>
                    {new Date(p.date).toLocaleDateString()}
                  </div>
                  <div className="row gap12">
                    <span className="num" style={{ fontWeight: 700 }}>
                      {p.e1rm.toFixed(1)}
                    </span>
                    <span className="dot" style={{ background: p.rating ? color.alive : color.ended }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color: c }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="col">
      <div className="label">{label}</div>
      <div className="row" style={{ alignItems: 'baseline', gap: 4 }}>
        <span className="bignum" style={{ fontSize: 24, color: c }}>
          {value}
        </span>
        {unit && <span className="faint" style={{ fontSize: 11 }}>{unit}</span>}
      </div>
    </div>
  );
}
