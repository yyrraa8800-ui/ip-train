// Shared presentational components: SVG rings, the signature life-cycle bar,
// sparklines, steppers, sheets, chips, toggles.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LifeStatus } from '../data/types';
import { color, statusColor } from './theme';

export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------
export function Ring({
  size = 64,
  stroke = 6,
  progress,
  ringColor = color.alive,
  track = color.surface3,
  children,
  animate = true,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  ringColor?: string;
  track?: string;
  children?: ReactNode;
  animate?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - clamp(progress));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={animate ? ({ '--circ': `${c}`, animation: 'ringfill 0.8s ease' } as any) : undefined}
        />
      </svg>
      {children != null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signature life-cycle "runway" bar (green -> amber -> red as it stalls)
// ---------------------------------------------------------------------------
export function LifeCycleBar({
  runway,
  status,
  height = 8,
}: {
  runway: number;
  status: LifeStatus;
  height?: number;
}) {
  return (
    <div className="runway" style={{ height }}>
      {/* faint full gradient hint of the runway */}
      <span
        style={{
          background: `linear-gradient(90deg, ${color.alive}22, ${color.slowing}22 60%, ${color.ended}33)`,
        }}
      />
      <span
        style={{
          width: `${clamp(runway) * 100}%`,
          background: statusColor[status],
          transition: 'width 0.5s ease, background 0.3s ease',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// e1RM sparkline
// ---------------------------------------------------------------------------
export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = color.alive,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} className="spark">
        <line x1={0} y1={height - 2} x2={width} y2={height - 2} stroke={color.line} strokeWidth={1} />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} className="spark">
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={stroke} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stepper (weight / reps)
// ---------------------------------------------------------------------------
export function Stepper({
  value,
  step = 1,
  min = 0,
  onChange,
  format,
}: {
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, round(value - step)))} aria-label="decrease">
        −
      </button>
      <div className="val num">{format ? format(value) : value}</div>
      <button onClick={() => onChange(round(value + step))} aria-label="increase">
        +
      </button>
    </div>
  );
}
function round(x: number): number {
  return Math.round(x * 100) / 100;
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------
export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle + chips
// ---------------------------------------------------------------------------
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <span className="knob" />
    </button>
  );
}

export function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`chip ${on ? 'chip-on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function StatusPill({ status, label }: { status: LifeStatus; label: string }) {
  return (
    <span className="chip">
      <span className="dot" style={{ background: statusColor[status] }} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Countdown rest timer (slides up)
// ---------------------------------------------------------------------------
export function RestTimer({
  seconds,
  onDone,
  onClose,
  beep,
  label,
}: {
  seconds: number;
  onDone: () => void;
  onClose: () => void;
  beep: boolean;
  label: string;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        if (beep) playBeep();
        onDone();
      }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, beep, onDone]);

  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  return (
    <Sheet onClose={onClose}>
      <div className="center col" style={{ alignItems: 'center', gap: 16, paddingBottom: 8 }}>
        <div className="label">{label}</div>
        <Ring size={180} stroke={12} progress={remaining / seconds} ringColor={color.alive} animate={false}>
          <div className="bignum" style={{ fontSize: 44 }}>
            {mm}:{String(ss).padStart(2, '0')}
          </div>
        </Ring>
        <div className="row gap12">
          <button className="btn" onClick={() => (startRef.current -= 15000)}>
            +15s
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Skip
          </button>
        </div>
      </div>
    </Sheet>
  );
}

let audioCtx: AudioContext | null = null;
export function playBeep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 880;
    o.type = 'sine';
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    o.start();
    o.stop(audioCtx.currentTime + 0.5);
    if ('vibrate' in navigator) navigator.vibrate?.(200);
  } catch {
    /* ignore */
  }
}

export function haptic() {
  try {
    if ('vibrate' in navigator) navigator.vibrate?.(10);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Mini horizontal volume bar with landmark band
// ---------------------------------------------------------------------------
export function VolumeBar({
  fraction,
  barColor,
  mevFrac,
  mavFrac,
}: {
  fraction: number;
  barColor: string;
  mevFrac: number;
  mavFrac: [number, number];
}) {
  return (
    <div
      style={{
        position: 'relative',
        height: 14,
        borderRadius: 8,
        background: color.surface3,
        overflow: 'hidden',
      }}
    >
      {/* MAV band */}
      <div
        style={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: `${clamp(mavFrac[0]) * 100}%`,
          width: `${clamp(mavFrac[1] - mavFrac[0]) * 100}%`,
          background: `${color.alive}22`,
        }}
      />
      {/* MEV line */}
      <div
        style={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: `${clamp(mevFrac) * 100}%`,
          width: 2,
          background: color.textFaint,
        }}
      />
      {/* fill */}
      <div
        style={{
          position: 'absolute',
          insetBlock: 3,
          insetInlineStart: 0,
          width: `${clamp(fraction, 0, 1) * 100}%`,
          background: barColor,
          borderRadius: 6,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}
