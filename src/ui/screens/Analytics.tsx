import { useStore, getState } from '../../store/store';
import { allMainSummaries, combinedRoster, activeCycles, gameProgress } from '../../store/selectors';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { Sparkline, Ring } from '../components';
import { InfoButton } from '../InfoButton';
import { earnedBadges, BADGES } from '../../engine';
import { color, statusColor } from '../theme';

export function Analytics() {
  useStore();
  const { t, pn, lang } = useI18n();
  const mains = allMainSummaries();
  const roster = combinedRoster();
  const cycles = activeCycles().filter((c) => c.series.length >= 2);
  const ended = getState().roster.filter((r) => !r.active).sort((a, b) => b.effectiveness - a.effectiveness);
  const g = gameProgress();
  const earned = new Set(earnedBadges(g).map((b) => b.id));

  return (
    <div className="screen">
      <div className="h1">{t('analytics_title')}</div>

      {/* Level / XP profile */}
      <div className="card mt8 row" style={{ gap: 14 }}>
        <Ring size={68} stroke={8} progress={g.progress} ringColor={color.alive}>
          <span className="bignum" style={{ fontSize: 22 }}>
            {g.level}
          </span>
        </Ring>
        <div className="grow">
          <div className="row gap6" style={{ alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>{g.rank}</span>
            <InfoButton topic="level" />
          </div>
          <div className="faint" style={{ fontSize: 11, marginBottom: 6 }}>
            {g.xpInLevel}/{g.xpForLevel} {t('xp')} · 🔥 {g.streak} · 🥇 {g.prs}
          </div>
          <div style={{ height: 8, borderRadius: 6, background: color.surface3, overflow: 'hidden' }}>
            <div style={{ width: `${g.progress * 100}%`, height: '100%', background: color.alive }} />
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="h2">{t('badges')}</div>
      <div className="row wrap gap6">
        {BADGES.map((b) => {
          const on = earned.has(b.id);
          return (
            <div
              key={b.id}
              className="card2 center"
              style={{ width: 'calc(33% - 6px)', padding: '12px 4px', opacity: on ? 1 : 0.4 }}
            >
              <div style={{ fontSize: 26, filter: on ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{lang === 'ar' ? b.ar : b.en}</div>
              {!on && <div className="faint" style={{ fontSize: 9 }}>{t('locked')}</div>}
            </div>
          );
        })}
      </div>

      <button className="btn btn-block mt16" onClick={() => navActions.push({ name: 'volume' })}>
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
                    +{c.strengthGained.toFixed(1)} pts
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
