import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail } from '../route';

/** GET /api/v1/shops/[slug] — shop detail + products + reviews */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const shop = await db.shop.findUnique({ where: { slug } });
  if (!shop) return fail('Shop not found', 'SHOP_NOT_FOUND', 404);

  const products = await db.product.findMany({
    where: { shopId: shop.id, status: 'ACTIVE' },
    take: 24,
    orderBy: { soldCount: 'desc' },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
  });

  return ok({ shop, products });
}
