import { useStore } from '../store/store';
import {
  translate,
  patternName,
  failureLabel,
  muscleLabel,
  dayName,
} from './strings';
import type { Pattern } from '../data/types';

export function useI18n() {
  const { settings } = useStore();
  const lang = settings.language;
  return {
    lang,
    rtl: lang === 'ar',
    t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    pn: (p: Pattern) => patternName(lang, p),
    fl: (id: string) => failureLabel(lang, id),
    ml: (k: string) => muscleLabel(lang, k),
    dn: (en: string, ar: string) => dayName(lang, en, ar),
  };
}

export type I18n = ReturnType<typeof useI18n>;
