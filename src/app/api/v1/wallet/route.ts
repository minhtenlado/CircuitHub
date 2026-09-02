import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/wallet?sellerId=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sellerId = url.searchParams.get('sellerId');
  if (!sellerId) return NextResponse.json({ success: false, message: 'sellerId required' }, { status: 422 });

  const wallet = await db.wallet.findUnique({ where: { sellerId } });
  const transactions = await db.walletTransaction.findMany({
    where: { walletId: wallet?.id ?? '__none__' },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return ok({ wallet, transactions });
}
