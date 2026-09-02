'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  price: number;
  productType: string;
  brand?: string | null;
  rating: number;
  ratingCount: number;
  shopName: string;
  shopSlug: string;
  shopVerified: boolean;
  // PCB specs
  pcbLayers?: number | null;
  pcbThickness?: number | null;
  pcbMaterial?: string | null;
  pcbSurfaceFinish?: string | null;
  pcbColor?: string | null;
  pcbDimensions?: string | null;
  // Digital
  software?: string | null;
  softwareVersion?: string | null;
  currentVersion?: string | null;
  licenseType?: string | null;
  fileFormat?: string | null;
  // Service
  serviceDurationDays?: number | null;
  serviceRevisions?: number | null;
  // Physical
  stockAvailable?: number;
  unlimited?: boolean;
  soldCount?: number;
}

interface CompareState {
  items: CompareItem[];
  isOpen: boolean;
  maxItems: number;
  add: (item: CompareItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  open: () => void;
  close: () => void;
  toggle: (item: CompareItem) => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      maxItems: 4,
      add: (item) =>
        set((s) => {
          if (s.items.some((i) => i.productId === item.productId)) return s;
          if (s.items.length >= s.maxItems) return s; // max 4
          return { items: [...s.items, item] };
        }),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      has: (productId) => get().items.some((i) => i.productId === productId),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: (item) =>
        set((s) => {
          if (s.items.some((i) => i.productId === item.productId)) {
            return { items: s.items.filter((i) => i.productId !== item.productId) };
          }
          if (s.items.length >= s.maxItems) return s;
          return { items: [...s.items, item] };
        }),
    }),
    { name: 'circuithub-compare' },
  ),
);
