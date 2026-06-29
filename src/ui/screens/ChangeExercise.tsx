import { useMemo, useState } from 'react';
import { resolveExercise, actions } from '../../store/store';
import { libraryForPattern } from '../../store/selectors';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { color } from '../theme';

/** Freely replace a slot's exercise with any same-pattern alternative
 *  (e.g. when a machine isn't available at the gym). */
export function ChangeExercise({ slot }: { slot: string }) {
  const { t, pn, rtl } = useI18n();
  const [query, setQuery] = useState('');
  const [dayIndex, order] = slot.split('.').map(Number);
  const resolved = resolveExercise(dayIndex, order);
  const options = useMemo(
    () =>
      resolved
        ? libraryForPattern(resolved.pattern)
            .filter((e) => e.nameEn !== resolved.name)
            .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
        : [],
    [resolved?.pattern, resolved?.name],
  );
  if (!resolved) return null;

  const filtered = options.filter((e) =>
    query ? e.nameEn.toLowerCase().includes(query.toLowerCase()) : true,
  );

  return (
    <div className="screen">
      <Header title={t('change_exercise')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="dim">
          {resolved.name} · {pn(resolved.pattern)}
        </div>
        <div className="muted-banner mt8" style={{ lineHeight: 1.5 }}>
          {t('change_hint')}
        </div>

        <input
          className="field mt16"
          placeholder={t('search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="dim mt8" style={{ fontSize: 12 }}>
          {filtered.length} {t('variations')}
        </div>

        {filtered.length === 0 ? (
          <div className="muted-banner mt8">{t('no_alternatives')}</div>
        ) : (
          <div className="col gap6 mt8">
            {filtered.map((e) => (
              <div key={e.nameEn} className="card2" style={{ textAlign: rtl ? 'right' : 'left' }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{e.nameEn}</div>
                <div className="row gap6">
                  {e.videoUrl && (
                    <button className="chip" onClick={() => window.open(e.videoUrl!, '_blank')} style={{ color: color.alive }}>
                      ▶ {t('watch')}
                    </button>
                  )}
                  <button
                    className="btn btn-primary grow"
                    style={{ padding: '11px 14px' }}
                    onClick={() => {
                      actions.changeExercise(slot, e.nameEn);
                      navActions.pop();
                    }}
                  >
                    {t('use_this')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
