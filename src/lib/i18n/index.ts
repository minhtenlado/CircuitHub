'use client';

/* ============================================================
   CircuitHub — i18n hook + helpers
   Re-exports the translations dictionary, language list, and a
   convenient `useI18n()` hook that returns `{ lang, setLang, t }`.
   ============================================================ */

import { useCallback } from 'react';
import { useI18nStore } from '@/stores/i18n-store';
import {
  translations,
  LANGS,
  DEFAULT_LANG,
  type Lang,
} from '@/lib/i18n/translations';

export { translations, LANGS, DEFAULT_LANG };
export type { Lang };

export interface UseI18nReturn {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

/** Get the current language, setter, and `t()` translator. */
export function useI18n(): UseI18nReturn {
  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const storeT = useI18nStore((s) => s.t);

  // Wrap in useCallback so consumers can depend on a stable `t`.
  const t = useCallback((key: string) => storeT(key), [storeT]);

  return { lang, setLang, t };
}

/** Get the human-readable label for a language code. */
export function langLabel(code: Lang): string {
  return LANGS.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

/** Get the short (2-letter) code for a language. */
export function langShort(code: Lang): string {
  return LANGS.find((l) => l.code === code)?.short ?? code.toUpperCase();
}

/** Get the flag emoji for a language. */
export function langFlag(code: Lang): string {
  return LANGS.find((l) => l.code === code)?.flag ?? '🌐';
}

export const SLUG_TO_CATEGORY_KEY: Record<string, string> = {
  'dev-boards': 'categories.devBoards',
  'pcb-boards': 'categories.pcbBoards',
  components: 'categories.components',
  sensors: 'categories.sensors',
  modules: 'categories.modules',
  tools: 'categories.tools',
  'open-source': 'categories.openSource',
  firmware: 'categories.firmware',
  'gerber-files': 'categories.gerberFiles',
  'kicad-projects': 'categories.kicadProjects',
  'altium-projects': 'categories.altiumProjects',
  'gerber-packages': 'categories.gerberPackages',
};

export function getCategoryName(
  slug: string | undefined | null,
  fallback: string,
  t: (key: string) => string,
): string {
  if (!slug) return fallback;
  const key = SLUG_TO_CATEGORY_KEY[slug];
  if (!key) return fallback;
  const translated = t(key);
  return translated && translated !== key ? translated : fallback;
}

export function getCategoryBlurb(
  slug: string | undefined | null,
  fallback: string,
  t: (key: string) => string,
): string {
  if (!slug) return fallback;
  const key = `categoryBlurbs.${slug}`;
  const translated = t(key);
  return translated && translated !== key ? translated : fallback;
}

