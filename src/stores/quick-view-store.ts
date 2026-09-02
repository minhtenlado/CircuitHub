'use client';

import { create } from 'zustand';

interface QuickViewState {
  product: any | null;
  isOpen: boolean;
  open: (product: any) => void;
  close: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  product: null,
  isOpen: false,
  open: (product) => set({ product, isOpen: true }),
  close: () => set({ isOpen: false }),
}));
