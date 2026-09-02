import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveDemoUserId } from '@/lib/api/auth-resolver';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** POST /api/v1/reviews — submit a review (verified purchase check) */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.productId || !body?.rating)
    return NextResponse.json({ success: false, message: 'userId, productId, rating required' }, { status: 422 });

  const userId = await resolveDemoUserId(body.userId);
  const rating = Math.max(1, Math.min(5, parseInt(body.rating, 10)));
  const product = await db.product.findUnique({ where: { id: body.productId } });
  if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

  // Check verified purchase
  const hasPurchased = await db.orderItem.findFirst({
    where: { productId: body.productId, order: { userId, paymentStatus: 'SUCCESS' } },
  });

  const review = await db.review.create({
    data: {
      userId,
      productId: body.productId,
      reviewType: 'PRODUCT',
      rating,
      comment: body.comment ?? '',
      verifiedPurchase: !!hasPurchased,
      moderationStatus: 'APPROVED',
    },
  });

  // Recompute product rating
  const agg = await db.review.aggregate({
    where: { productId: body.productId, moderationStatus: 'APPROVED' },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: body.productId },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });

  return ok({ review });
}
