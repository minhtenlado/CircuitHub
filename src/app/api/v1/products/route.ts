import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** Standard API envelope */
export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** GET /api/v1/products — list with filters */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const category = url.searchParams.get('category');
  const productType = url.searchParams.get('productType'); // PHYSICAL | DIGITAL | SERVICE | BUNDLE
  const software = url.searchParams.get('software');
  const minPrice = parseInt(url.searchParams.get('minPrice') ?? '0', 10);
  const maxPrice = parseInt(url.searchParams.get('maxPrice') ?? '0', 10);
  const sort = url.searchParams.get('sort') ?? 'popular';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '24', 10), 96);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0);
  const featured = url.searchParams.get('featured');
  const trending = url.searchParams.get('trending');
  const isNew = url.searchParams.get('new');

  const where: any = { status: 'ACTIVE' };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { shortDescription: { contains: q } },
      { description: { contains: q } },
      { mpn: { contains: q } },
      { sku: { contains: q } },
      { brand: { contains: q } },
    ];
  }
  if (category) {
    const cat = await db.category.findUnique({ where: { slug: category } });
    if (cat) {
      const subs = await db.category.findMany({ where: { parentId: cat.id } });
      const ids = [cat.id, ...subs.map((s) => s.id)];
      where.categoryId = { in: ids };
    }
  }
  if (productType) where.productType = productType;
  if (software) where.software = software;
  if (minPrice > 0 || maxPrice > 0) {
    where.price = {};
    if (minPrice > 0) where.price.gte = minPrice;
    if (maxPrice > 0) where.price.lte = maxPrice;
  }
  if (featured === 'true') where.isFeatured = true;
  if (trending === 'true') where.isTrending = true;
  if (isNew === 'true') where.isNew = true;

  const orderBy: any = {
    popular: { soldCount: 'desc' },
    newest: { createdAt: 'desc' },
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    rating: { rating: 'desc' },
    trending: { viewCount: 'desc' },
  }[sort] ?? { soldCount: 'desc' };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        shop: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true, verified: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { order: 'asc' }, take: 4 },
      },
    }),
    db.product.count({ where }),
  ]);

  return ok({
    items: items.map((p) => ({
      ...p,
      discountPct: p.compareAtPrice ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0,
    })),
    total,
    limit,
    offset,
    sort,
  });
}
