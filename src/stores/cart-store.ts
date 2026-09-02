'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Cart item shape (frontend-side) */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string;
  price: number;
  productType: string;
  shopId: string;
  shopName: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      updateQty: (productId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: 'circuithub-cart' },
  ),
);

/** Compute cart totals */
export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  // group by shop
  const byShop = new Map<string, { shopId: string; shopName: string; items: CartItem[]; subtotal: number }>();
  for (const item of items) {
    if (!byShop.has(item.shopId)) {
      byShop.set(item.shopId, { shopId: item.shopId, shopName: item.shopName, items: [], subtotal: 0 });
    }
    const g = byShop.get(item.shopId)!;
    g.items.push(item);
    g.subtotal += item.price * item.quantity;
  }
  return { subtotal, count, byShop: Array.from(byShop.values()) };
}
