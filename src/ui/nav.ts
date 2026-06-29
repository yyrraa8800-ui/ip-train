// Minimal navigation: top-level tabs + a push stack for detail screens.
import { useSyncExternalStore } from 'react';
import type { Pattern } from '../data/types';

export type Tab = 'hub' | 'today' | 'library' | 'analytics' | 'settings';

export type Route =
  | { name: 'pattern'; pattern: Pattern }
  | { name: 'exercise'; slot: string }
  | { name: 'logger'; dayIndex: number }
  | { name: 'swap'; slot: string }
  | { name: 'change'; slot: string }
  | { name: 'volume' }
  | { name: 'mesocycle' }
  | { name: 'about' }
  | { name: 'guide' };

interface NavState {
  tab: Tab;
  stack: Route[];
}

let nav: NavState = { tab: 'hub', stack: [] };
const listeners = new Set<() => void>();
function emit() {
  nav = { ...nav };
  listeners.forEach((l) => l());
}

export const navActions = {
  setTab(tab: Tab) {
    nav.tab = tab;
    nav.stack = [];
    emit();
  },
  push(route: Route) {
    nav.stack = [...nav.stack, route];
    emit();
  },
  pop() {
    nav.stack = nav.stack.slice(0, -1);
    emit();
  },
  popToRoot() {
    nav.stack = [];
    emit();
  },
  replace(route: Route) {
    nav.stack = [...nav.stack.slice(0, -1), route];
    emit();
  },
};

export function useNav(): NavState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => nav,
    () => nav,
  );
}
