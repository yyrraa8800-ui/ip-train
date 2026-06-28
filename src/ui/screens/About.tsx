import { seed } from '../../data/seed';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { color } from '../theme';

export function About() {
  const { t } = useI18n();
  return (
    <div className="screen">
      <Header title={t('about')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 18 }}>{t('about_credit')}</div>
          <a href="https://instagram.com/m_almarzouq7" target="_blank" rel="noreferrer" style={{ color: color.alive }}>
            @M_almarzouq7
          </a>
          <div className="dim mt8" style={{ fontSize: 13 }}>
            {seed.program.name} — a {seed.program.weeks}-week mesocycle (+ deload) of {seed.program.days.filter((d) => !d.isRest).length} training days.
          </div>
        </div>

        <div className="h2">{t('ip_method')}</div>
        <div className="card2" style={{ lineHeight: 1.6, fontSize: 14 }}>
          <p style={{ marginTop: 0 }}>
            The IP Method (Jon Walland) organises training around six movement patterns. Each
            exercise variation is productive only for a window: you push it with double progression
            until it stalls — its life cycle ends — then swap to a same-pattern variation that
            attacks the weak point the last one exposed. Strength carries forward, and your most
            effective variations get cycled back in.
          </p>
          <p style={{ marginBottom: 0 }}>
            Rotation is triggered by <strong>stagnation, not by whim</strong>: frequent swapping
            makes progressive overload impossible to track, so this app only nudges a swap once a
            lift has genuinely stalled.
          </p>
        </div>

        <div className="h2">Disclaimer</div>
        <div className="muted-banner" style={{ lineHeight: 1.6 }}>
          {t('disclaimer')}
        </div>

        <div className="faint center mt16" style={{ fontSize: 11, paddingBottom: 24 }}>
          Generated {new Date(seed.meta.generatedAt).toLocaleDateString()} · {seed.meta.note}
        </div>
      </div>
    </div>
  );
}
