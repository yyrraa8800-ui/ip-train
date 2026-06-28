import { useState } from 'react';
import { useStore, actions, hydrate } from '../../store/store';
import { exportRaw, importRaw } from '../../store/persist';
import { useI18n } from '../../i18n';
import { navActions } from '../nav';
import { Toggle, Chip, Sheet } from '../components';
import { color } from '../theme';
import { seed } from '../../data/seed';

export function Settings() {
  const state = useStore();
  const { t } = useI18n();
  const [sheet, setSheet] = useState<'export' | 'import' | null>(null);
  const [importText, setImportText] = useState('');

  return (
    <div className="screen">
      <div className="h1">{t('settings_title')}</div>

      <div className="card mt8">
        <Row label={t('units')}>
          <div className="row gap6">
            <Chip label={t('kg')} on={state.settings.units === 'kg'} onClick={() => actions.setSettings({ units: 'kg' })} />
            <Chip label={t('lb')} on={state.settings.units === 'lb'} onClick={() => actions.setSettings({ units: 'lb' })} />
          </div>
        </Row>
        <div className="divider" />
        <Row label={t('language')}>
          <div className="row gap6">
            <Chip label="EN" on={state.settings.language === 'en'} onClick={() => actions.setSettings({ language: 'en' })} />
            <Chip label="ع" on={state.settings.language === 'ar'} onClick={() => actions.setSettings({ language: 'ar' })} />
          </div>
        </Row>
        <div className="divider" />
        <Row label={t('notifications')}>
          <Toggle on={state.settings.notifications} onChange={(v) => actions.setSettings({ notifications: v })} />
        </Row>
      </div>

      <div className="h2">{t('backup')}</div>
      <div className="card">
        <button className="btn btn-block btn-ghost" onClick={() => setSheet('export')}>
          ⬆ {t('export_data')}
        </button>
        <div className="divider" />
        <button className="btn btn-block btn-ghost" onClick={() => setSheet('import')}>
          ⬇ {t('import_data')}
        </button>
      </div>

      <div className="card mt16">
        <button className="btn btn-block btn-ghost" onClick={() => navActions.push({ name: 'guide' })}>
          📖 {t('guide')}
        </button>
        <div className="divider" />
        <button className="btn btn-block btn-ghost" onClick={() => navActions.push({ name: 'about' })}>
          ℹ {t('about')}
        </button>
      </div>

      <button
        className="btn btn-block btn-danger mt16"
        onClick={() => {
          if (confirm(t('reset_confirm'))) actions.resetAll();
        }}
      >
        {t('reset')}
      </button>

      <div className="faint center mt16" style={{ fontSize: 11 }}>
        {seed.program.author} · {seed.meta.source}
      </div>

      {sheet === 'export' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2" style={{ marginTop: 0 }}>{t('export_data')}</div>
          <p className="dim" style={{ fontSize: 13 }}>
            Copy this text somewhere safe. Paste it back via Import to restore.
          </p>
          <textarea className="field" style={{ height: 180, fontFamily: 'monospace', fontSize: 11 }} readOnly value={exportRaw()} />
          <button
            className="btn btn-primary btn-block mt8"
            onClick={() => {
              navigator.clipboard?.writeText(exportRaw());
              setSheet(null);
            }}
          >
            Copy
          </button>
        </Sheet>
      )}

      {sheet === 'import' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2" style={{ marginTop: 0 }}>{t('import_data')}</div>
          <textarea
            className="field"
            style={{ height: 180, fontFamily: 'monospace', fontSize: 11 }}
            placeholder="Paste backup JSON…"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button
            className="btn btn-primary btn-block mt8"
            style={{ background: color.alive }}
            onClick={() => {
              if (importRaw(importText)) {
                hydrate();
                setSheet(null);
              } else {
                alert('Invalid backup.');
              }
            }}
          >
            {t('import_data')}
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row-between">
      <div style={{ fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
