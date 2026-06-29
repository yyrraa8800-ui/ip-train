import { useStore, TOTAL_WEEKS, DELOAD_WEEK, lifecycleForSlot } from '../../store/store';
import { allMainSummaries, patternSummary, gameProgress, endedSlots } from '../../store/selectors';
import { slotsForPattern } from '../../store/selectors';
import { ISOLATION_PATTERNS } from '../../data/types';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { Ring, LifeCycleBar } from '../components';
import { InfoButton } from '../InfoButton';
import { color, statusColor, statusKey } from '../theme';

export function Hub() {
  const state = useStore();
  const { t, pn, rtl } = useI18n();
  const mains = allMainSummaries();
  const g = gameProgress();
  const ended = endedSlots();
  const isWeekDeload = state.weekIndex === DELOAD_WEEK;

  return (
    <div className="screen">
      <div className="row-between">
        <div className="h1" style={{ marginBottom: 0 }}>
          {t('app_name')}
        </div>
        <button className="chip tappable" onClick={() => navActions.push({ name: 'mesocycle' })}>
          {t('block')} {state.blockNumber} · {isWeekDeload ? t('deload') : `${t('week')} ${state.weekIndex}/${TOTAL_WEEKS}`}
        </button>
      </div>

      {/* Game header */}
      <div className="card mt8">
        <div className="row" style={{ gap: 14 }}>
          <Ring size={72} stroke={8} progress={g.progress} ringColor={color.alive}>
            <div className="col" style={{ alignItems: 'center', lineHeight: 1 }}>
              <span className="faint" style={{ fontSize: 8 }}>
                {t('level').toUpperCase()}
              </span>
              <span className="bignum" style={{ fontSize: 22 }}>
                {g.level}
              </span>
            </div>
          </Ring>
          <div className="grow">
            <div className="row gap6" style={{ alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 18 }}>{g.rank}</span>
              <InfoButton topic="level" />
            </div>
            <div className="faint" style={{ fontSize: 11, marginBottom: 6 }}>
              {g.xpInLevel}/{g.xpForLevel} {t('xp')}
            </div>
            <div style={{ height: 8, borderRadius: 6, background: color.surface3, overflow: 'hidden' }}>
              <div style={{ width: `${g.progress * 100}%`, height: '100%', background: color.alive, transition: 'width .5s' }} />
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 14 }}>
          <MiniStat icon="🔥" value={g.streak} label={t('streak')} />
          <MiniStat icon="🏋️" value={g.workouts} label={t('workouts')} />
          <MiniStat icon="🥇" value={g.prs} label={t('records')} />
        </div>
      </div>

      {/* Today's mission */}
      <button className="btn btn-primary btn-block mt16" onClick={() => navActions.setTab('today')}>
        ▶ {t('todays_mission')}
      </button>

      {/* Needs your pick — ended cycles */}
      {ended.length > 0 && (
        <>
          <div className="h2" style={{ color: color.ended }}>
            🔴 {t('needs_pick')}
          </div>
          <div className="col gap12">
            {ended.map(({ ref, lc }) => (
              <button
                key={ref.slot}
                className="tappable"
                style={{
                  background: '#241114',
                  border: `1px solid ${color.ended}`,
                  borderRadius: 14,
                  padding: 14,
                  textAlign: rtl ? 'right' : 'left',
                }}
                onClick={() => navActions.push({ name: 'swap', slot: ref.slot })}
              >
                <div style={{ fontWeight: 700 }}>{lc.exerciseName}</div>
                <div style={{ color: color.ended, fontSize: 13, marginTop: 2 }}>
                  {t('cycle_ended_choose')} ›
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <div className="h2">{t('hub_main')}</div>
        <InfoButton topic="pattern" />
      </div>
      <div className="col gap12">
        {mains.map((s) => {
          const slots = slotsForPattern(s.pattern);
          let worstRunway = 0;
          for (const sl of slots) {
            const lc = lifecycleForSlot(sl.slot);
            if (lc && lc.series.length) worstRunway = Math.max(worstRunway, runwayFromStatus(lc.status));
          }
          return (
            <button
              key={s.pattern}
              className="card tappable"
              style={{ textAlign: rtl ? 'right' : 'left' }}
              onClick={() => navActions.push({ name: 'pattern', pattern: s.pattern })}
            >
              <div className="row" style={{ gap: 14 }}>
                <Ring size={56} stroke={6} progress={s.level} ringColor={statusColor[s.status]}>
                  <span className="num" style={{ fontSize: 13, fontWeight: 800 }}>
                    {Math.round(s.level * 100)}
                  </span>
                </Ring>
                <div className="grow">
                  <div className="row-between">
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{pn(s.pattern)}</div>
                    <span className="dot" style={{ background: statusColor[s.status] }} />
                  </div>
                  <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>
                    {t(statusKey[s.status])} · {s.activeCount} {t('exercises')}
                  </div>
                  <LifeCycleBar runway={worstRunway} status={s.status} height={6} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="h2">{t('hub_iso')}</div>
      <div className="row wrap gap12">
        {ISOLATION_PATTERNS.map((p) => {
          const s = patternSummary(p);
          return (
            <button key={p} className="chip tappable" onClick={() => navActions.push({ name: 'pattern', pattern: p })}>
              <span className="dot" style={{ background: statusColor[s.status] }} />
              {pn(p)}
              <span className="faint num" style={{ fontSize: 11 }}>
                {Math.round(s.level * 100)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="card2 grow center" style={{ padding: '10px 6px' }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div className="bignum" style={{ fontSize: 20 }}>
        {value}
      </div>
      <div className="label" style={{ fontSize: 9 }}>
        {label}
      </div>
    </div>
  );
}

function runwayFromStatus(status: string): number {
  return status === 'ended' ? 1 : status === 'slowing' ? 0.6 : 0.25;
}
