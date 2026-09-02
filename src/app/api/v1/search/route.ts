import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/search?q=ESP32 — autocomplete suggestions
 * Returns: products (5), categories (3), shops (2), brands (3)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();

  if (!q || q.length < 2) {
    return ok({ products: [], categories: [], shops: [], brands: [] });
  }

  const [products, categories, shops] = await Promise.all([
    db.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: q } },
          { mpn: { contains: q } },
          { sku: { contains: q } },
          { brand: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        productType: true,
        brand: true,
        rating: true,
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        shop: { select: { name: true, verified: true } },
      },
    }),
    db.category.findMany({
      where: { name: { contains: q } },
      take: 3,
      select: { id: true, name: true, slug: true, icon: true },
    }),
    db.shop.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ name: { contains: q } }, { specializations: { contains: q } }],
      },
      take: 3,
      select: { id: true, name: true, slug: true, logoUrl: true, verified: true, rating: true },
    }),
  ]);

  // Extract unique brands from products
  const brandSet = new Set<string>();
  for (const p of products) {
    if (p.brand) brandSet.add(p.brand);
  }
  // Also search brands across more products
  const brandProducts = await db.product.findMany({
    where: { status: 'ACTIVE', brand: { contains: q } },
    distinct: ['brand'],
    take: 5,
    select: { brand: true },
  });
  for (const p of brandProducts) {
    if (p.brand) brandSet.add(p.brand);
  }

  return ok({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      productType: p.productType,
      brand: p.brand,
      rating: p.rating,
      imageUrl: p.images?.[0]?.url,
      shopName: p.shop?.name,
      shopVerified: p.shop?.verified,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    })),
    shops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logoUrl,
      verified: s.verified,
      rating: s.rating,
    })),
    brands: Array.from(brandSet).slice(0, 4),
  });
}
