import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** GET /api/v1/products/[slug] — single product with full details */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      shop: true,
      category: true,
      images: { orderBy: { order: 'asc' } },
      versions: { orderBy: { releaseDate: 'desc' } },
      reviews: {
        where: { moderationStatus: 'APPROVED' },
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!product) return fail('Product not found', 'PRODUCT_NOT_FOUND', 404);

  // increment view count async (fire and forget)
  db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Related products (same category, different product)
  const related = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: 'ACTIVE',
      id: { not: product.id },
    },
    take: 6,
    orderBy: { soldCount: 'desc' },
    include: {
      shop: { select: { id: true, name: true, slug: true, logoUrl: true, rating: true, verified: true } },
      images: { orderBy: { order: 'asc' }, take: 1 },
    },
  });

  return ok({
    ...product,
    discountPct: product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0,
    related: related.map((p) => ({
      ...p,
      discountPct: p.compareAtPrice
        ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
        : 0,
    })),
  });
}
