'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (productId: string) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => {
          const exists = s.items.some((i) => i.productId === item.productId);
          if (exists) return { items: s.items.filter((i) => i.productId !== item.productId) };
          return { items: [...s.items, item] };
        }),
      has: (productId) => get().items.some((i) => i.productId === productId),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'circuithub-wishlist' },
  ),
);
