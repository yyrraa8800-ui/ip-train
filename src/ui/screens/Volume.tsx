import { useStore, actions, TOTAL_WEEKS, DELOAD_WEEK } from '../../store/store';
import { currentVolume } from '../../store/selectors';
import { LANDMARKS, MUSCLE_ORDER, volumeStatus, volumeFraction, totalSets } from '../../engine';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { VolumeBar, Chip } from '../components';
import { InfoButton } from '../InfoButton';
import { color, volumeColor } from '../theme';

export function Volume() {
  const state = useStore();
  const { t, ml } = useI18n();
  const vol = currentVolume();
  const isDeload = state.weekIndex === DELOAD_WEEK;

  const statusLabel: Record<string, string> = {
    under: t('under_mev'),
    optimal: t('optimal'),
    over: t('over_mrv'),
  };

  return (
    <div className="screen">
      <Header title={t('volume_title')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="dim" style={{ fontSize: 13, marginBottom: 10 }}>
          {t('volume_planned')}
        </div>
        <div className="row wrap gap6">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
            <Chip
              key={w}
              label={w === DELOAD_WEEK ? t('deload') : `${w}`}
              on={w === state.weekIndex}
              onClick={() => actions.setWeek(w)}
            />
          ))}
        </div>

        <div className="card mt16 row-between">
          <div className="row gap6" style={{ alignItems: 'center' }}>
            <div className="label">{isDeload ? t('deload') : `${t('week')} ${state.weekIndex}`}</div>
            <InfoButton topic="volume" />
          </div>
          <div className="bignum" style={{ fontSize: 22 }}>
            {totalSets(vol)} <span className="faint" style={{ fontSize: 12 }}>{t('sets_per_week')}</span>
          </div>
        </div>

        <div className="muted-banner mt16" style={{ fontSize: 12 }}>
          {t('landmark_hint')}
        </div>

        <div className="col gap12 mt16">
          {MUSCLE_ORDER.map((m) => {
            const sets = vol[m] ?? 0;
            const lm = LANDMARKS[m];
            const status = volumeStatus(m, sets);
            return (
              <div key={m}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{ml(m)}</div>
                  <div className="row gap6">
                    <span className="num" style={{ fontWeight: 700 }}>{sets}</span>
                    <span className="tag" style={{ color: volumeColor[status], background: 'transparent', borderColor: volumeColor[status] }}>
                      {statusLabel[status]}
                    </span>
                  </div>
                </div>
                <VolumeBar
                  fraction={volumeFraction(m, sets)}
                  barColor={volumeColor[status]}
                  mevFrac={lm.mev / lm.mrv}
                  mavFrac={[lm.mav[0] / lm.mrv, lm.mav[1] / lm.mrv]}
                />
                <div className="faint" style={{ fontSize: 10, marginTop: 3 }}>
                  MEV {lm.mev} · MAV {lm.mav[0]}–{lm.mav[1]} · MRV {lm.mrv}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: color.line, margin: '16px 0' }} />
      </div>
    </div>
  );
}
