'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string; // BUYER | SELLER | ADMIN | SUPER_ADMIN ...
  avatarUrl?: string;
  shopId?: string;
  shopSlug?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  /** Demo quick login (skips real auth) */
  demoLogin: (role: 'buyer' | 'seller' | 'admin') => void;
}

const demoAccounts: Record<'buyer' | 'seller' | 'admin', AuthUser> = {
  buyer: {
    id: 'demo-buyer',
    email: 'buyer1@example.com',
    name: 'Buyer 1',
    role: 'BUYER',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=buyer1&backgroundColor=ecfeff',
  },
  seller: {
    id: 'demo-seller',
    email: 'seller@boardforge.vn',
    name: 'BoardForge Studio',
    role: 'SELLER',
    shopId: 'demo-shop',
    shopSlug: 'boardforge-studio',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=boardforge&backgroundColor=06b6d4',
  },
  admin: {
    id: 'demo-admin',
    email: 'admin@circuithub.vn',
    name: 'Admin User',
    role: 'ADMIN',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=admin&backgroundColor=06b6d4',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      demoLogin: (role) =>
        set({ user: demoAccounts[role], token: `demo-token-${role}-${Date.now()}` }),
    }),
    { name: 'circuithub-auth' },
  ),
);
