import { useStore, TOTAL_WEEKS, DELOAD_WEEK } from '../../store/store';
import { allMainSummaries, patternSummary } from '../../store/selectors';
import { ISOLATION_PATTERNS } from '../../data/types';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { Ring, LifeCycleBar } from '../components';
import { color, statusColor, statusKey } from '../theme';
import { lifecycleForSlot } from '../../store/store';
import { slotsForPattern } from '../../store/selectors';

export function Hub() {
  const state = useStore();
  const { t, pn, rtl } = useI18n();
  const mains = allMainSummaries();
  const isWeekDeload = state.weekIndex === DELOAD_WEEK;

  return (
    <div className="screen">
      <div className="row-between">
        <div>
          <div className="h1">{t('app_name')}</div>
          <div className="dim" style={{ fontSize: 14 }}>
            {t('tagline')}
          </div>
        </div>
        <button
          className="card2 tappable"
          style={{ textAlign: rtl ? 'right' : 'left', padding: '8px 12px' }}
          onClick={() => navActions.push({ name: 'mesocycle' })}
        >
          <div className="label" style={{ fontSize: 10 }}>
            {t('block')} {state.blockNumber}
          </div>
          <div className="bignum" style={{ fontSize: 20, color: isWeekDeload ? color.slowing : color.text }}>
            {isWeekDeload ? t('deload') : `${t('week')} ${state.weekIndex}`}
          </div>
          <div className="faint" style={{ fontSize: 11 }}>
            / {TOTAL_WEEKS}
          </div>
        </button>
      </div>

      <div className="h2">{t('hub_main')}</div>
      <div className="col gap12">
        {mains.map((s) => {
          // representative active runway for this pattern (worst slot)
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
            <button
              key={p}
              className="chip tappable"
              onClick={() => navActions.push({ name: 'pattern', pattern: p })}
            >
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

function runwayFromStatus(status: string): number {
  return status === 'ended' ? 1 : status === 'slowing' ? 0.6 : 0.25;
}
