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
  | 'bom'
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
  | 'admin-login'
  | 'about'
  | 'seller-onboarding';

export type ViewRole = 'buyer' | 'seller' | 'admin';

interface NavState {
  view: AppView;
  params: Record<string, string>;
  role: ViewRole;
  setView: (view: AppView, params?: Record<string, string>) => void;
  setRole: (role: ViewRole) => void;
  /** Restore state from a hash string (used on page load + back/forward) */
  restoreFromHash: () => void;
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
  goAuth: (mode: 'login' | 'register', returnView?: AppView, returnParams?: Record<string, string>) => void;
}

/** Parse the URL hash into { view, params }.
 *  Hash format: #/view?param1=value1&param2=value2
 */
function parseHash(): { view: AppView; params: Record<string, string> } {
  if (typeof window === 'undefined') return { view: 'home', params: {} };

  // 1. Check pathname (e.g. /admin, /seller)
  const pathname = window.location.pathname.replace(/^\//, '');
  if (pathname === 'admin' || pathname.startsWith('admin/')) {
    return { view: 'admin', params: {} };
  }
  if (pathname === 'seller' || pathname.startsWith('seller/')) {
    return { view: 'seller', params: {} };
  }

  // 2. Check query string (e.g. ?_vercel_share=.../admin or ?admin or ?view=admin)
  const search = window.location.search;
  const sp = new URLSearchParams(search);
  const viewParam = sp.get('view');
  const vercelShare = sp.get('_vercel_share') || '';
  if (viewParam === 'admin' || sp.has('admin') || vercelShare.includes('/admin')) {
    return { view: 'admin', params: {} };
  }
  if (viewParam === 'seller' || sp.has('seller') || vercelShare.includes('/seller')) {
    return { view: 'seller', params: {} };
  }

  // 3. Check hash (e.g. #admin, #/admin)
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return { view: 'home', params: {} };
  // Remove leading slash
  const path = hash.replace(/^\//, '');
  const [viewPart, queryPart] = path.split('?');
  const view = (viewPart || 'home') as AppView;
  const params: Record<string, string> = {};
  if (queryPart) {
    const sp = new URLSearchParams(queryPart);
    sp.forEach((v, k) => { if (v) params[k] = v; });
  }
  return { view, params };
}

/** Build a hash string from view + params */
function buildHash(view: AppView, params: Record<string, string>): string {
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  return `/${view}${qs}`;
}

export const useNavStore = create<NavState>((set, get) => ({
  view: 'home',
  params: {},
  role: 'buyer',
  setView: (view, params = {}) => {
    set({ view, params });
    if (typeof window !== 'undefined') {
      const hash = buildHash(view, params);
      // Only push to history if the hash actually changed (avoid duplicate entries)
      const currentHash = window.location.hash.replace(/^#/, '');
      if (currentHash !== hash) {
        window.history.pushState(null, '', `#${hash}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  setRole: (role) => set({ role }),
  restoreFromHash: () => {
    if (typeof window === 'undefined') return;
    const { view, params } = parseHash();
    set({ view, params });
  },
  goHome: () => get().setView('home', {}),
  goProducts: (filters = {}) => get().setView('products', filters),
  goCategory: (slug) => get().setView('category', { slug }),
  goProduct: (slug) => get().setView('product-detail', { slug }),
  goShop: (slug) => get().setView('shop', { slug }),
  goCart: () => get().setView('cart', {}),
  goCheckout: () => get().setView('checkout', {}),
  goBuyer: (view) => get().setView(view, {}),
  goSeller: (view = 'seller') => get().setView(view, {}),
  goAdmin: (view = 'admin') => get().setView(view, {}),
  goAuth: (mode, returnView, returnParams) => {
    const params: Record<string, string> = {};
    if (returnView) {
      params.returnView = returnView;
      if (returnParams) {
        Object.entries(returnParams).forEach(([k, v]) => {
          params[`rp_${k}`] = v;
        });
      }
    }
    get().setView(mode, params);
  },
}));

/** Setup hash-change listener for browser back/forward navigation.
 *  Call this once in the root layout (client-side). */
let hashListenerSetup = false;
export function setupHashListener() {
  if (typeof window === 'undefined') return;
  // Restore on initial load
  useNavStore.getState().restoreFromHash();
  if (hashListenerSetup) return;
  hashListenerSetup = true;
  // Listen for back/forward
  window.addEventListener('popstate', () => {
    useNavStore.getState().restoreFromHash();
  });
  // Also listen for hashchange as a fallback
  window.addEventListener('hashchange', () => {
    useNavStore.getState().restoreFromHash();
  });
}
