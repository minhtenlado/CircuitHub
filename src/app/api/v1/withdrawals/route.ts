import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/withdrawals?sellerId=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sellerId = url.searchParams.get('sellerId');
  if (!sellerId) return NextResponse.json({ success: false, message: 'sellerId required' }, { status: 422 });
  const items = await db.withdrawal.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, take: 50 });
  return ok({ items });
}

/** POST /api/v1/withdrawals — request a new withdrawal */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sellerId || !body?.amount)
    return NextResponse.json({ success: false, message: 'sellerId, amount required' }, { status: 422 });
  const amount = Math.round(parseInt(body.amount, 10));
  if (amount < 50000)
    return NextResponse.json({ success: false, message: 'Min withdrawal is 50,000₫' }, { status: 422 });

  const wallet = await db.wallet.findUnique({ where: { sellerId: body.sellerId } });
  if (!wallet || wallet.availableBalance < amount)
    return NextResponse.json({ success: false, message: 'Insufficient available balance' }, { status: 422 });

  const withdrawal = await db.withdrawal.create({
    data: {
      sellerId: body.sellerId,
      amount,
      bankInfo: JSON.stringify(body.bankInfo ?? {}),
      status: 'PENDING',
    },
  });
  // Freeze the amount immediately
  await db.wallet.update({
    where: { sellerId: body.sellerId },
    data: {
      availableBalance: { decrement: amount },
      frozenBalance: { increment: amount },
    },
  });
  await db.walletTransaction.create({
    data: { walletId: wallet.id, type: 'WITHDRAWAL', amount: -amount, balanceType: 'AVAILABLE', reference: withdrawal.id, note: 'Withdrawal request' },
  });

  // Notify admins
  const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'] } } });
  for (const a of admins) {
    await db.notification.create({
      data: { userId: a.id, type: 'WITHDRAWAL_REQUEST', title: 'Withdrawal pending approval', body: `New withdrawal request for ${amount.toLocaleString('vi-VN')}₫.`, link: '#/admin/withdrawals' },
    });
  }
  return ok({ withdrawal });
}
