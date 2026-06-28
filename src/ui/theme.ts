// Design tokens. Dark-primary "training instrument" palette; numbers are the
// hero. Semantic life-cycle colours are used consistently everywhere.

import type { LifeStatus } from '../data/types';

export const color = {
  bg: '#0B0B0E',
  surface: '#15161B',
  surface2: '#1D1F26',
  surface3: '#23252E',
  line: '#2A2C36',
  text: '#F4F4F6',
  textDim: '#9A9CA6',
  textFaint: '#5A5C66',
  // semantic life-cycle
  alive: '#7CFF3F',
  slowing: '#FFB020',
  ended: '#FF4D4D',
  accent: '#7CFF3F',
  accentDim: '#3a5a26',
};

export const statusColor: Record<LifeStatus, string> = {
  alive: color.alive,
  slowing: color.slowing,
  ended: color.ended,
};

export const statusKey: Record<LifeStatus, string> = {
  alive: 'status_alive',
  slowing: 'status_slowing',
  ended: 'status_ended',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const space = (n: number) => n * 4;

export const volumeColor = {
  under: color.slowing,
  optimal: color.alive,
  over: color.ended,
};
