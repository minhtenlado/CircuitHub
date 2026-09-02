'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  price: number;
  productType: string;
  shopName: string;
  shopSlug: string;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  maxItems: number;
  add: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      maxItems: 12,
      add: (item) =>
        set((s) => {
          const filtered = s.items.filter((i) => i.productId !== item.productId);
          return { items: [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, s.maxItems) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: 'circuithub-recently-viewed' },
  ),
);
