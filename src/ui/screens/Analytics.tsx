import { useStore, getState } from '../../store/store';
import { allMainSummaries, combinedRoster, activeCycles } from '../../store/selectors';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { Sparkline } from '../components';
import { color, statusColor } from '../theme';

export function Analytics() {
  useStore();
  const { t, pn } = useI18n();
  const mains = allMainSummaries();
  const roster = combinedRoster();
  const cycles = activeCycles().filter((c) => c.series.length >= 2);
  const ended = getState().roster.filter((r) => !r.active).sort((a, b) => b.effectiveness - a.effectiveness);

  return (
    <div className="screen">
      <div className="h1">{t('analytics_title')}</div>

      <button className="btn btn-block mt8" onClick={() => navActions.push({ name: 'volume' })}>
        📊 {t('volume_title')} ›
      </button>

      <div className="h2">{t('pattern_progress')}</div>
      <div className="col gap12">
        {mains.map((s) => (
          <div key={s.pattern} className="card2">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{pn(s.pattern)}</div>
              <div className="num" style={{ fontWeight: 700 }}>{Math.round(s.level * 100)}</div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: color.surface3, overflow: 'hidden' }}>
              <div style={{ width: `${s.level * 100}%`, height: '100%', background: statusColor[s.status] }} />
            </div>
          </div>
        ))}
      </div>

      {cycles.length > 0 && (
        <>
          <div className="h2">{t('e1rm')}</div>
          <div className="col gap12">
            {cycles.map((c) => (
              <div key={c.id} className="card2 row-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.exerciseName}</div>
                  <div className="faint" style={{ fontSize: 11 }}>
                    +{c.strengthGained.toFixed(1)} e1RM
                  </div>
                </div>
                <Sparkline values={c.series.map((p) => p.e1rm)} width={120} height={36} stroke={statusColor[c.status]} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h2">{t('completed_cycles')}</div>
      {ended.length === 0 && roster.length === 0 ? (
        <div className="muted-banner">{t('no_roster')}</div>
      ) : (
        <div className="col gap6">
          {(ended.length ? ended : roster).map((r, i) => (
            <div key={r.exerciseName + i} className="card2 row-between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.exerciseName}</div>
                <div className="faint" style={{ fontSize: 11 }}>{pn(r.pattern)}</div>
              </div>
              <div className="row gap12" style={{ alignItems: 'baseline' }}>
                <span className="num">{r.durationWeeks.toFixed(1)}{t('weeks').slice(0, 1)}</span>
                <span className="num" style={{ color: color.alive, fontWeight: 700 }}>+{r.strengthGained.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
