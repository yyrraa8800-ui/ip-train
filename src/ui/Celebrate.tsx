import { useEffect } from 'react';
import { useI18n } from '../i18n';
import { Sheet, Ring, playBeep } from './components';
import { color } from './theme';

export interface Celebration {
  xpGained: number;
  leveledTo?: number;
  prs?: number;
  rank?: string;
}

/** A short celebratory moment after finishing a workout (level-up / records). */
export function Celebrate({ data, onClose }: { data: Celebration; onClose: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    playBeep();
  }, []);
  const leveled = data.leveledTo != null;
  return (
    <Sheet onClose={onClose}>
      <div className="center col" style={{ alignItems: 'center', gap: 14, paddingBottom: 6 }}>
        <div style={{ fontSize: 52 }}>{leveled ? '🎉' : data.prs ? '🥇' : '✅'}</div>
        {leveled ? (
          <>
            <div className="h1" style={{ fontSize: 26, margin: 0 }}>
              {t('level_up')}
            </div>
            <Ring size={120} stroke={10} progress={1} ringColor={color.alive} animate>
              <div className="bignum" style={{ fontSize: 40 }}>
                {data.leveledTo}
              </div>
            </Ring>
            <div className="dim">
              {t('reached_level')} {data.leveledTo} · {data.rank}
            </div>
          </>
        ) : (
          <div className="h1" style={{ fontSize: 24, margin: 0 }}>
            {data.prs ? t('new_record') : t('keep_going')}
          </div>
        )}

        <div className="row gap12" style={{ marginTop: 4 }}>
          <Stat label={t('xp_earned')} value={`+${data.xpGained}`} />
          {data.prs ? <Stat label={t('records')} value={`+${data.prs}`} /> : null}
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={onClose}>
          {t('done')}
        </button>
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card2 center" style={{ padding: '10px 18px' }}>
      <div className="bignum" style={{ fontSize: 24, color: color.alive }}>
        {value}
      </div>
      <div className="label" style={{ fontSize: 9 }}>
        {label}
      </div>
    </div>
  );
}
