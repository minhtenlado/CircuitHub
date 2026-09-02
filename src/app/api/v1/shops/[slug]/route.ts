import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

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
