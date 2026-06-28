import { useI18n } from '../../i18n';
import { getGuide } from '../../i18n/guide';
import { Header } from '../App';
import { navActions } from '../nav';
import { color } from '../theme';

export function Guide() {
  const { t, lang, rtl } = useI18n();
  const guide = getGuide(lang);
  return (
    <div className="screen">
      <Header title={t('guide')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px', textAlign: rtl ? 'right' : 'left' }}>
        <div className="dim" style={{ fontSize: 15, lineHeight: 1.6 }}>
          {guide.intro}
        </div>

        {guide.sections.map((s, i) => (
          <div key={i} className="card mt16">
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{s.h}</div>
            <div className="col" style={{ gap: 10 }}>
              {s.p.map((para, j) => (
                <p key={j} style={{ margin: 0, lineHeight: 1.6, fontSize: 14, color: color.text }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        ))}

        <div className="muted-banner mt16" style={{ lineHeight: 1.6 }}>
          {t('disclaimer')}
        </div>
        <div className="faint center mt16" style={{ fontSize: 11, paddingBottom: 24 }}>
          {t('app_by')} Yaqoub Alhadad
        </div>
      </div>
    </div>
  );
}
