import { useMemo, useState } from 'react';
import { seed } from '../../data/seed';
import { MAIN_PATTERNS, ISOLATION_PATTERNS, type Pattern } from '../../data/types';
import { useI18n } from '../../i18n';
import { Chip } from '../components';
import { color } from '../theme';

interface Row {
  name: string;
  pattern: Pattern;
  category: string;
  videoUrl: string | null;
}

export function Library() {
  const { t, pn } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Pattern | 'all'>('all');

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const seen = new Set<string>();
    for (const g of seed.variationLibrary) {
      for (const e of g.exercises) {
        const key = e.nameEn.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name: e.nameEn, pattern: g.pattern, category: g.category, videoUrl: e.videoUrl });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = rows.filter((r) => {
    if (filter !== 'all' && r.pattern !== filter) return false;
    if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="screen">
      <div className="h1">{t('library_title')}</div>
      <input
        className="field mt8"
        placeholder={t('search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
        {filtered.map((r) => (
          <div key={r.name} className="card2 row-between">
            <div className="grow">
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
              <div className="faint" style={{ fontSize: 11 }}>{pn(r.pattern)}</div>
            </div>
            {r.videoUrl && (
              <button className="chip" onClick={() => window.open(r.videoUrl!, '_blank')} style={{ color: color.alive }}>
                ▶ {t('watch')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
