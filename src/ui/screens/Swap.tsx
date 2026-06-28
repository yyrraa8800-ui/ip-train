import { useState } from 'react';
import { useStore, resolveExercise, lifecycleForSlot, actions } from '../../store/store';
import {
  libraryForPattern,
  rosterForPattern,
  recentlyUsedFor,
} from '../../store/selectors';
import {
  failureModesForPattern,
  rankSwapCandidates,
  carryForwardLoad,
} from '../../engine';
import { useI18n } from '../../i18n';
import { Header } from '../App';
import { navActions } from '../nav';
import { color } from '../theme';

export function SwapFlow({ slot }: { slot: string }) {
  const state = useStore();
  const { t, fl, pn, rtl } = useI18n();
  const [dayIndex, order] = slot.split('.').map(Number);
  const resolved = resolveExercise(dayIndex, order);
  const [failure, setFailure] = useState<string | null>(null);
  if (!resolved) return null;

  const modes = failureModesForPattern(resolved.pattern);
  const lc = lifecycleForSlot(slot);
  const priorE1RM = lc?.currentTopSetE1RM ?? lc?.startTopSetE1RM ?? 0;

  if (!failure) {
    return (
      <div className="screen">
        <Header title={t('swap_title')} onBack={() => navActions.pop()} />
        <div style={{ padding: '0 16px' }}>
          <div className="dim">{resolved.name} · {pn(resolved.pattern)}</div>
          <div className="h2">{t('swap_where')}</div>
          <div className="col gap12">
            {modes.map((m) => (
              <button
                key={m.id}
                className="card tappable row-between"
                style={{ textAlign: rtl ? 'right' : 'left' }}
                onClick={() => setFailure(m.weakPoint)}
              >
                <span style={{ fontWeight: 700 }}>{fl(m.id)}</span>
                <span className="faint">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const candidates = libraryForPattern(resolved.pattern);
  const roster = rosterForPattern(resolved.pattern);
  const recently = recentlyUsedFor(resolved.pattern);
  const ranked = rankSwapCandidates(candidates, {
    weakPoint: failure,
    roster,
    recentlyUsed: recently,
    currentExerciseName: resolved.name,
    maxResults: 3,
  });
  const carry = carryForwardLoad(priorE1RM, state.settings.units);

  return (
    <div className="screen">
      <Header title={t('swap_recs')} onBack={() => setFailure(null)} />
      <div style={{ padding: '0 16px' }}>
        <div className="dim" style={{ marginBottom: 6 }}>
          {t('targets')}: {fl(failure)}
        </div>
        <div className="col gap12">
          {ranked.map((r, i) => (
            <div key={r.exercise.nameEn} className="card" style={{ borderColor: i === 0 ? color.alive : undefined }}>
              {i === 0 && (
                <div className="label" style={{ color: color.alive, marginBottom: 4 }}>
                  ★ {t('swap_recs')}
                </div>
              )}
              <div className="row-between">
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.exercise.nameEn}</div>
                {r.exercise.videoUrl && (
                  <button className="chip" onClick={() => window.open(r.exercise.videoUrl!, '_blank')}>
                    ▶ {t('watch')}
                  </button>
                )}
              </div>
              <div className="row wrap gap6 mt8">
                {r.targetsWeakPoint && (
                  <span className="tag" style={{ color: color.alive, background: '#13240a' }}>
                    {t('targets')} {fl(failure)}
                  </span>
                )}
                {r.priorEffectiveness > 0 && <span className="tag">proven for you</span>}
              </div>
              <div className="row-between mt8">
                <div className="dim">
                  {t('carry_load')}{' '}
                  <span className="num" style={{ color: color.text, fontWeight: 700 }}>
                    {carry.weight} {state.settings.units} × {carry.reps}
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    actions.acceptSwap(slot, r.exercise.nameEn, carry.weight);
                    navActions.pop();
                  }}
                >
                  {t('accept_swap')}
                </button>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <div className="muted-banner">No alternative variations found.</div>}
        </div>
      </div>
    </div>
  );
}
