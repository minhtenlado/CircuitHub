'use client';

import { useQuery } from '@tanstack/react-query';

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  productType: string;
  price: number;
  compareAtPrice?: number | null;
  brand?: string | null;
  rating: number;
  ratingCount: number;
  soldCount: number;
  stockAvailable: number;
  unlimited: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  software?: string | null;
  softwareVersion?: string | null;
  currentVersion?: string | null;
  licenseType?: string | null;
  downloadCount?: number;
  pcbLayers?: number | null;
  pcbColor?: string | null;
  serviceDurationDays?: number | null;
  images: { url: string; alt?: string | null }[];
  shop: { id: string; name: string; slug: string; logoUrl?: string | null; rating: number; verified: boolean };
  category: { id: string; name: string; slug: string };
  discountPct: number;
}

export interface ProductListResponse {
  items: ProductCard[];
  total: number;
  limit: number;
  offset: number;
  sort: string;
}

export function useProducts(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  return useQuery<ProductListResponse>({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products?${qs.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string | null) {
  return useQuery<any>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${slug}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useShops(featured = false, limit = 12) {
  return useQuery<any[]>({
    queryKey: ['shops', { featured, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/v1/shops?limit=${limit}${featured ? '&featured=true' : ''}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.items;
    },
    staleTime: 60 * 1000,
  });
}

export function useShop(slug: string | null) {
  return useQuery<any>({
    queryKey: ['shop', slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/shops/${slug}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!slug,
  });
}

export function useSellerAnalytics(sellerId: string | null) {
  return useQuery<any>({
    queryKey: ['seller-analytics', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/seller?sellerId=${sellerId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!sellerId,
  });
}

export function useAdminAnalytics() {
  return useQuery<any>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/analytics/admin');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminSellers() {
  return useQuery<any>({
    queryKey: ['admin-sellers'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/sellers');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
  });
}

/** Admin products — returns ALL products regardless of status */
export function useAdminProducts(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  return useQuery<{ items: any[]; total: number }>({
    queryKey: ['admin-products', params],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/products/list?${qs.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    staleTime: 15 * 1000,
  });
}

export function useAdminUsers(role?: string) {
  return useQuery<any>({
    queryKey: ['admin-users', role],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/users${role ? `?role=${role}` : ''}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
  });
}

export function useAdminWithdrawals() {
  return useQuery<any>({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/withdrawals');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
  });
}

export function useAuditLogs(limit = 50) {
  return useQuery<any>({
    queryKey: ['audit-logs', limit],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/audit-logs?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
  });
}

export function useNotifications(userId?: string | null) {
  return useQuery<any>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/notifications?userId=${userId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.items;
    },
    enabled: !!userId,
    refetchInterval: 30 * 1000,
  });
}

export function useOrders(userId?: string | null, role?: 'seller' | 'admin') {
  return useQuery<any>({
    queryKey: ['orders', userId, role],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (userId) qs.set('userId', userId);
      if (role) qs.set('role', role);
      const res = await fetch(`/api/v1/orders?${qs.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.items;
    },
  });
}

export function useSellerProducts(sellerId?: string | null) {
  return useQuery<any>({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/seller/products?sellerId=${sellerId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data.items;
    },
    enabled: !!sellerId,
  });
}

export function useWallet(sellerId?: string | null) {
  return useQuery<any>({
    queryKey: ['wallet', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/wallet?sellerId=${sellerId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!sellerId,
  });
}
