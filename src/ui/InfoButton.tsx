import { useState } from 'react';
import { useI18n } from '../i18n';
import { getExplain } from '../i18n/explain';
import { Sheet } from './components';
import { color } from './theme';

/** A small "?" chip that opens a plain-language explanation of a term. */
export function InfoButton({ topic }: { topic: string }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const ex = getExplain(lang, topic);
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="explain"
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          border: `1px solid ${color.line}`,
          color: color.textDim,
          fontSize: 11,
          fontWeight: 800,
          lineHeight: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        ?
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 8 }}>{ex.title}</div>
          <div style={{ lineHeight: 1.65, fontSize: 15, color: color.text }}>{ex.body}</div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setOpen(false)}>
            Got it
          </button>
        </Sheet>
      )}
    </>
  );
}
