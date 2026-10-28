import { useMemo, useState } from 'react';
import { actions } from '../../store/store';
import { seed } from '../../data/seed';
import { MAIN_PATTERNS, ISOLATION_PATTERNS, type Pattern } from '../../data/types';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { showToast } from '../toast';
import { Chip } from '../components';
import { color } from '../theme';

interface Opt {
  name: string;
  pattern: Pattern;
  muscleKey: string;
  videoUrl: string | null;
}

/** Add any library exercise (any pattern) to a program day — e.g. direct
 *  glutes/forearms or an extra lift the user wants. */
export function AddExercise({ dayIndex }: { dayIndex: number }) {
  const { t, pn } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Pattern | 'all'>('all');

  const options = useMemo<Opt[]>(() => {
    const out: Opt[] = [];
    const seen = new Set<string>();
    for (const g of seed.variationLibrary) {
      for (const e of g.exercises) {
        if (seen.has(e.nameEn)) continue;
        seen.add(e.nameEn);
        out.push({ name: e.nameEn, pattern: e.pattern ?? g.pattern, muscleKey: g.muscleKey, videoUrl: e.videoUrl });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = options.filter((o) => {
    if (filter !== 'all' && o.pattern !== filter) return false;
    if (query && !o.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const day = seed.program.days.find((d) => d.index === dayIndex);

  return (
    <div className="screen">
      <Header title={t('add_exercise_day')} onBack={() => navActions.pop()} />
      <div style={{ padding: '0 16px' }}>
        <div className="dim">{day?.nameEn}</div>
        <input className="field mt8" placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="row wrap gap6 mt8">
          <Chip label={t('all_patterns')} on={filter === 'all'} onClick={() => setFilter('all')} />
          {[...MAIN_PATTERNS, ...ISOLATION_PATTERNS].map((p) => (
            <Chip key={p} label={pn(p)} on={filter === p} onClick={() => setFilter(p)} />
          ))}
        </div>
        <div className="dim mt8" style={{ fontSize: 12 }}>
          {filtered.length} {t('variations')}
        </div>
        <div className="col gap6 mt8">
          {filtered.map((o) => (
            <div key={o.name} className="card2">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{o.name}</div>
              <div className="faint" style={{ fontSize: 11, marginBottom: 10 }}>{pn(o.pattern)}</div>
              <div className="row gap6">
                {o.videoUrl && (
                  <button className="chip" style={{ color: color.alive }} onClick={() => window.open(o.videoUrl!, '_blank')}>
                    ▶ {t('watch')}
                  </button>
                )}
                <button
                  className="btn btn-primary grow"
                  style={{ padding: '11px 14px' }}
                  onClick={() => {
                    actions.addCustomExercise(dayIndex, {
                      nameEn: o.name,
                      pattern: o.pattern,
                      muscleKey: o.muscleKey,
                      videoUrl: o.videoUrl,
                    });
                    showToast(`＋ ${o.name}`);
                    navActions.pop();
                  }}
                >
                  {t('add')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
