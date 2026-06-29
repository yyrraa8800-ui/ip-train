import { useState } from 'react';
import { actions } from '../../store/store';
import { useI18n } from '../../i18n';
import { APP_AUTHOR } from '../../i18n/strings';
import type { Language, Units } from '../../data/types';
import { Chip, Ring } from '../components';
import { color } from '../theme';

export function Onboarding() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<Units>('kg');
  const [language, setLanguage] = useState<Language>('en');

  const cards = [
    {
      art: (
        <Ring size={120} stroke={10} progress={0.66} ringColor={color.alive}>
          <div className="bignum" style={{ fontSize: 30 }}>
            ∞
          </div>
        </Ring>
      ),
      title: t('onb_welcome'),
      body: t('tagline'),
    },
    {
      art: <div style={{ fontSize: 64 }}>⬡</div>,
      title: 'Six patterns, one method',
      body: 'Every lift is a variation of one of six movement patterns. Level each pattern up like a skill — and track isolation work separately.',
    },
    {
      art: (
        <div style={{ width: 160 }}>
          <div className="runway" style={{ height: 12 }}>
            <span style={{ background: `linear-gradient(90deg, ${color.alive}, ${color.slowing} 60%, ${color.ended})` }} />
            <span style={{ width: '70%', background: color.slowing }} />
          </div>
        </div>
      ),
      title: 'Run the life cycle',
      body: 'Push a variation with double progression (6–12 reps, smallest load jumps). When it stalls, its life cycle has ended.',
    },
    {
      art: <div style={{ fontSize: 64 }}>🔁</div>,
      title: 'Evolve on stall — not on a whim',
      body: 'When a lift stalls, the app hands you a same-pattern variation that fixes the weak point it exposed. Your strength carries forward to the new one.',
    },
    {
      art: <div style={{ fontSize: 64 }}>🎮</div>,
      title: 'Level up as you train',
      body: 'Finish workouts, beat your last numbers, and set records to earn XP, raise your level, keep a streak, and unlock achievements. Consistency turns into progress.',
    },
    {
      art: <div style={{ fontSize: 56 }}>▶️✅</div>,
      title: 'How to use it',
      body: '1) Today → Start workout.  2) Enter weight & reps, tap the green ✓ (rest timer starts).  3) Beat last time’s faint numbers.  4) When a bar turns red, tap it and pick your next exercise. That’s it. Re-read anytime in Settings → How it works.',
    },
  ];

  if (step < cards.length) {
    const c = cards[step];
    return (
      <div className="screen center" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24 }}>
          <div>{c.art}</div>
          <div className="h1" style={{ fontSize: 26 }}>
            {c.title}
          </div>
          <div className="dim" style={{ maxWidth: 320, fontSize: 16 }}>
            {c.body}
          </div>
        </div>
        <div className="row center" style={{ justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {cards.map((_, i) => (
            <span key={i} className="dot" style={{ width: 7, height: 7, background: i === step ? color.alive : color.line }} />
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={() => setStep(step + 1)}>
          {step === 0 ? t('onb_get_started') : t('onb_next')}
        </button>
      </div>
    );
  }

  // Final setup step
  return (
    <div className="screen">
      <div className="h1">{t('app_name')}</div>
      <div className="dim">{t('app_by')} {APP_AUTHOR}</div>
      <div className="faint" style={{ fontSize: 12 }}>{t('program_by')} Mohammad Almarzouq</div>

      <div className="h2">{t('onb_lang_q')}</div>
      <div className="row gap12">
        <Chip label="English" on={language === 'en'} onClick={() => setLanguage('en')} />
        <Chip label="العربية" on={language === 'ar'} onClick={() => setLanguage('ar')} />
      </div>

      <div className="h2">{t('onb_units_q')}</div>
      <div className="row gap12">
        <Chip label={t('kg')} on={units === 'kg'} onClick={() => setUnits('kg')} />
        <Chip label={t('lb')} on={units === 'lb'} onClick={() => setUnits('lb')} />
      </div>

      <div className="muted-banner mt16" style={{ fontSize: 13 }}>
        {t('disclaimer')}
      </div>

      <button
        className="btn btn-primary btn-block mt16"
        onClick={() => actions.completeOnboarding({ units, language })}
      >
        {t('onb_done')}
      </button>
    </div>
  );
}
