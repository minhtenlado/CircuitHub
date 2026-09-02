'use client';

import { create } from 'zustand';

export type AppView =
  | 'home'
  | 'products'
  | 'category'
  | 'product-detail'
  | 'shop'
  | 'cart'
  | 'checkout'
  | 'buyer-orders'
  | 'buyer-downloads'
  | 'buyer-wishlist'
  | 'buyer-profile'
  | 'seller'
  | 'seller-products'
  | 'seller-orders'
  | 'seller-wallet'
  | 'seller-analytics'
  | 'admin'
  | 'admin-users'
  | 'admin-sellers'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-withdrawals'
  | 'admin-analytics'
  | 'admin-audit-logs'
  | 'login'
  | 'register'
  | 'about'
  | 'seller-onboarding';

export type ViewRole = 'buyer' | 'seller' | 'admin';

interface NavState {
  view: AppView;
  params: Record<string, string>;
  role: ViewRole;
  setView: (view: AppView, params?: Record<string, string>) => void;
  setRole: (role: ViewRole) => void;
  /** Convenience navigation handlers */
  goHome: () => void;
  goProducts: (filters?: Record<string, string>) => void;
  goCategory: (slug: string) => void;
  goProduct: (slug: string) => void;
  goShop: (slug: string) => void;
  goCart: () => void;
  goCheckout: () => void;
  goBuyer: (view: 'buyer-orders' | 'buyer-downloads' | 'buyer-wishlist' | 'buyer-profile') => void;
  goSeller: (view?: 'seller' | 'seller-products' | 'seller-orders' | 'seller-wallet' | 'seller-analytics') => void;
  goAdmin: (view?: 'admin' | 'admin-users' | 'admin-sellers' | 'admin-products' | 'admin-orders' | 'admin-withdrawals' | 'admin-analytics' | 'admin-audit-logs') => void;
  goAuth: (mode: 'login' | 'register') => void;
}

export const useNavStore = create<NavState>((set) => ({
  view: 'home',
  params: {},
  role: 'buyer',
  setView: (view, params = {}) => {
    set({ view, params });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = `/${view}${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`;
      window.history.replaceState(null, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  setRole: (role) => set({ role }),
  goHome: () => set({ view: 'home', params: {} }),
  goProducts: (filters = {}) => set({ view: 'products', params: filters }),
  goCategory: (slug) => set({ view: 'category', params: { slug } }),
  goProduct: (slug) => set({ view: 'product-detail', params: { slug } }),
  goShop: (slug) => set({ view: 'shop', params: { slug } }),
  goCart: () => set({ view: 'cart', params: {} }),
  goCheckout: () => set({ view: 'checkout', params: {} }),
  goBuyer: (view) => set({ view, params: {} }),
  goSeller: (view = 'seller') => set({ view, params: {} }),
  goAdmin: (view = 'admin') => set({ view, params: {} }),
  goAuth: (mode) => set({ view: mode, params: {} }),
}));
