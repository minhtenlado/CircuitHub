import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/shops — list shops */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '12', 10), 48);
  const featured = url.searchParams.get('featured') === 'true';

  const where: any = { status: 'ACTIVE', verified: true };
  const shops = await db.shop.findMany({
    where,
    orderBy: [{ rating: 'desc' }, { completedOrders: 'desc' }],
    take: limit,
  });
  return ok({ items: shops });
}
