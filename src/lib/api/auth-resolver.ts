import { db } from '@/lib/db';

/**
 * Resolve a demo-* user ID (e.g. 'demo-buyer', 'demo-seller', 'demo-admin')
 * to a real database user ID. Demo IDs are used by the frontend auth store
 * but don't exist in the User table, so they would violate foreign key
 * constraints. This helper returns the first real user matching the role.
 */
export async function resolveDemoUserId(rawUserId: string): Promise<string> {
  if (!rawUserId.startsWith('demo-')) return rawUserId;
  const role = rawUserId.replace('demo-', '').toUpperCase();
  // Map BUYER/SELLER/ADMIN to the actual role strings in the DB
  const dbRole =
    role === 'BUYER' ? 'BUYER' :
    role === 'SELLER' ? 'SELLER' :
    role === 'ADMIN' ? 'ADMIN' :
    role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' :
    'BUYER';
  const user = await db.user.findFirst({
    where: { role: dbRole },
    orderBy: { createdAt: 'asc' },
  });
  return user?.id ?? rawUserId;
}

/** Resolve a demo-seller ID to a real seller's shop ID as well. */
export async function resolveDemoSellerShop(rawSellerId: string): Promise<{ sellerId: string; shopId: string | null }> {
  const sellerId = await resolveDemoUserId(rawSellerId);
  const shop = await db.shop.findUnique({ where: { sellerId } });
  return { sellerId, shopId: shop?.id ?? null };
}
