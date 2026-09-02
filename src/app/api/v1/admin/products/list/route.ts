import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/admin/products — list ALL products (including REJECTED, SUSPENDED, DRAFT)
 * Query params: status, productType, q, sort, limit, offset
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status'); // ACTIVE | REJECTED | SUSPENDED | DRAFT | PENDING_REVIEW | all
  const productType = url.searchParams.get('productType');
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const sort = url.searchParams.get('sort') ?? 'newest';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0);

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (productType && productType !== 'all') where.productType = productType;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { shortDescription: { contains: q } },
      { mpn: { contains: q } },
      { sku: { contains: q } },
      { brand: { contains: q } },
    ];
  }

  const orderBy: any = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    sold: { soldCount: 'desc' },
    rating: { rating: 'desc' },
  }[sort] ?? { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        shop: { select: { id: true, name: true, slug: true, logoUrl: true, verified: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
    }),
    db.product.count({ where }),
  ]);

  return ok({
    items: items.map((p) => ({
      ...p,
      discountPct: p.compareAtPrice
        ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
        : 0,
    })),
    total,
    limit,
    offset,
  });
}
