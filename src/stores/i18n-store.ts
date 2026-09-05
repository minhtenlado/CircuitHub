'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  translations,
  DEFAULT_LANG,
  type Lang,
} from '@/lib/i18n/translations';

/* ============================================================
   i18n Zustand store with persist
   - Stores the current language (vi/en/zh/ja)
   - Exposes `t(key)` for dot-separated paths
   - Falls back to the key string if path not found
   ============================================================ */

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a dot-separated key (e.g. 'nav.products') */
  t: (key: string) => string;
}

/** Traverse an object by a dot-separated path. Returns the value or undefined. */
function traverse(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const seg of path) {
    if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return cur;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: DEFAULT_LANG,
      setLang: (lang) => set({ lang }),
      t: (key: string) => {
        const lang = get().lang;
        const parts = key.split('.');
        // Try current language first
        const value = traverse(translations[lang], parts);
        if (typeof value === 'string') return value;
        // Fallback to default language (en if vi missing, otherwise DEFAULT_LANG)
        const fallback = traverse(translations.en, parts);
        if (typeof fallback === 'string') return fallback;
        // Last resort: return the key itself
        return key;
      },
    }),
    {
      name: 'circuithub-i18n',
      // Only persist the language selection
      partialize: (s) => ({ lang: s.lang }) as I18nState,
    },
  ),
);
