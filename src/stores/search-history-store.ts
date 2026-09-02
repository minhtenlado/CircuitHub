'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchHistoryState {
  searches: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      searches: [],
      add: (query) => {
        const q = query.trim();
        if (!q || q.length < 2) return;
        set((s) => ({
          searches: [q, ...s.searches.filter((x) => x !== q)].slice(0, 5),
        }));
      },
      remove: (query) => set((s) => ({ searches: s.searches.filter((x) => x !== query) })),
      clear: () => set({ searches: [] }),
    }),
    { name: 'circuithub-search-history' },
  ),
);
