import { seed } from '../../data/seed';
import { useStore, actions, TOTAL_WEEKS, DELOAD_WEEK } from '../../store/store';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { Chip } from '../components';
import { color } from '../theme';

export function Mesocycle() {
  const state = useStore();
  const { t, dn } = useI18n();
  const isDeload = state.weekIndex === DELOAD_WEEK;

  return (
    <div className="screen">
      <Header title={t('meso_title')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 18 }}>{seed.program.name}</div>
          <div className="dim">{seed.program.author}</div>
          <div className="row-between mt16">
            <div className="col">
              <div className="label">{t('block')}</div>
              <div className="bignum" style={{ fontSize: 24 }}>{state.blockNumber}</div>
            </div>
            <div className="col">
              <div className="label">{t('week')}</div>
              <div className="bignum" style={{ fontSize: 24, color: isDeload ? color.slowing : color.text }}>
                {isDeload ? t('deload') : state.weekIndex} <span className="faint" style={{ fontSize: 12 }}>/ {TOTAL_WEEKS}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="label mt16">{t('week')}</div>
        <div className="row wrap gap6 mt8">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
            <Chip
              key={w}
              label={w === DELOAD_WEEK ? t('deload') : `${w}`}
              on={w === state.weekIndex}
              onClick={() => actions.setWeek(w)}
            />
          ))}
        </div>

        {isDeload && (
          <div className="muted-banner mt16" style={{ borderColor: color.slowing, color: color.slowing }}>
            {t('deload_prompt')}
          </div>
        )}

        <div className="h2">{t('meso_overview')}</div>
        <div className="col gap6">
          {seed.program.days.map((d) => (
            <div key={d.index} className="card2 row-between">
              <div>
                <div style={{ fontWeight: 600 }}>{dn(`Day ${d.index} · ${d.nameEn}`, `${d.nameAr}`)}</div>
                <div className="faint" style={{ fontSize: 11 }}>
                  {d.isRest ? t('rest_day') : `${d.exercises.length} ${t('exercises')}`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-block mt16"
          onClick={() => {
            actions.generateNextBlock();
            navActions.popToRoot();
          }}
        >
          🔁 {t('next_block')}
        </button>
        <div className="faint center mt8" style={{ fontSize: 11, paddingBottom: 16 }}>
          {t('disclaimer')}
        </div>
      </div>
    </div>
  );
}
