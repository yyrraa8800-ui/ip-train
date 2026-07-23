import { useState } from 'react';
import { useStore } from '../../store/store';
import { workoutHistory } from '../../store/selectors';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { color } from '../theme';

export function History() {
  useStore();
  const { t, dn, rtl } = useI18n();
  const items = workoutHistory();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="screen">
      <Header title={t('workout_history')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? (
          <div className="muted-banner">{t('no_history_yet')}</div>
        ) : (
          <div className="col gap6">
            {items.map((it) => (
              <div key={it.id} className="card2" style={{ textAlign: rtl ? 'right' : 'left' }}>
                <button
                  className="row-between"
                  style={{ width: '100%', textAlign: 'inherit', background: 'none' }}
                  onClick={() => setOpen(open === it.id ? null : it.id)}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{dn(it.nameEn, it.nameAr || it.nameEn)}</div>
                    <div className="faint" style={{ fontSize: 11 }}>
                      {new Date(it.date).toLocaleDateString()} · {t('week')} {it.weekIndex}
                    </div>
                  </div>
                  <div className="row gap12" style={{ alignItems: 'baseline' }}>
                    <span className="num" title={t('total_volume')}>
                      {it.sets}×
                    </span>
                    {it.durationMin != null && (
                      <span className="faint num" style={{ fontSize: 12 }}>
                        {it.durationMin}m
                      </span>
                    )}
                    <span className="faint">{open === it.id ? '▾' : '›'}</span>
                  </div>
                </button>
                {open === it.id && (
                  <div className="col gap6" style={{ marginTop: 10 }}>
                    {it.exercises.map((e, i) => (
                      <div key={i} className="row-between" style={{ fontSize: 13 }}>
                        <span className="dim">{e.name}</span>
                        <span className="num" style={{ fontWeight: 600 }}>{e.top}</span>
                      </div>
                    ))}
                    <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
                      {t('total_volume')}: {it.volume.toLocaleString()} {' '}
                      <span style={{ color: color.textFaint }}>({it.sets} sets)</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
