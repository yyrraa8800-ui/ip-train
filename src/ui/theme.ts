// Design tokens as CSS variables so light + dark themes both resolve at runtime.
// The actual values live in global.css (:root and :root[data-theme="light"]).

import type { LifeStatus } from '../data/types';

export const color = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  line: 'var(--line)',
  line2: 'var(--line2)',
  text: 'var(--text)',
  textDim: 'var(--dim)',
  textFaint: 'var(--faint)',
  alive: 'var(--alive)',
  slowing: 'var(--slowing)',
  ended: 'var(--ended)',
  accent: 'var(--alive)',
  onAccent: 'var(--on-accent)',
  okBg: 'var(--ok-bg)',
  okLine: 'var(--ok-line)',
  dangerBg: 'var(--danger-bg)',
  dangerLine: 'var(--danger-line)',
  warnBg: 'var(--warn-bg)',
  aliveSoft: 'var(--alive-soft)',
  slowingSoft: 'var(--slowing-soft)',
  endedSoft: 'var(--ended-soft)',
};

export const statusColor: Record<LifeStatus, string> = {
  alive: 'var(--alive)',
  slowing: 'var(--slowing)',
  ended: 'var(--ended)',
};

export const statusKey: Record<LifeStatus, string> = {
  alive: 'status_alive',
  slowing: 'status_slowing',
  ended: 'status_ended',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const space = (n: number) => n * 4;

export const volumeColor = {
  under: 'var(--slowing)',
  optimal: 'var(--alive)',
  over: 'var(--ended)',
};
