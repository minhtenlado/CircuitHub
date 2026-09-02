import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/admin/withdrawals — list all withdrawals */
export async function GET() {
  const withdrawals = await db.withdrawal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { seller: { select: { name: true, email: true, avatarUrl: true, shop: { select: { name: true, slug: true } } } } },
  });
  return ok({ items: withdrawals });
}

/** PATCH /api/v1/admin/withdrawals — approve/reject a withdrawal */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.withdrawalId || !body?.action)
    return NextResponse.json({ success: false, message: 'withdrawalId, action required' }, { status: 422 });

  const w = await db.withdrawal.findUnique({ where: { id: body.withdrawalId } });
  if (!w) return NextResponse.json({ success: false, message: 'Withdrawal not found' }, { status: 404 });
  if (w.status !== 'PENDING')
    return NextResponse.json({ success: false, message: 'Withdrawal already processed' }, { status: 422 });

  if (body.action === 'APPROVE') {
    await db.withdrawal.update({ where: { id: w.id }, data: { status: 'PROCESSING' } });
    // Debit wallet
    const wallet = await db.wallet.findUnique({ where: { sellerId: w.sellerId } });
    if (!wallet || wallet.availableBalance < w.amount)
      return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 422 });
    await db.wallet.update({
      where: { sellerId: w.sellerId },
      data: { availableBalance: { decrement: w.amount }, totalWithdrawn: { increment: w.amount } },
    });
    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: 'WITHDRAWAL', amount: -w.amount, balanceType: 'AVAILABLE', reference: w.id },
    });
    // Mark completed
    await db.withdrawal.update({ where: { id: w.id }, data: { status: 'COMPLETED', processedAt: new Date() } });
    await db.notification.create({
      data: { userId: w.sellerId, type: 'WITHDRAWAL_COMPLETED', title: 'Withdrawal completed', body: `Your ${w.amount.toLocaleString('vi-VN')}₫ withdrawal is completed.`, link: '#/seller/wallet' },
    });
  } else if (body.action === 'REJECT') {
    await db.withdrawal.update({
      where: { id: w.id },
      data: { status: 'REJECTED', rejectedReason: body.reason ?? 'Rejected by admin', processedAt: new Date() },
    });
    await db.notification.create({
      data: { userId: w.sellerId, type: 'WITHDRAWAL_REJECTED', title: 'Withdrawal rejected', body: `Your withdrawal was rejected. Reason: ${body.reason ?? 'Rejected by admin'}.`, link: '#/seller/wallet' },
    });
  }

  return ok({ withdrawalId: w.id, action: body.action });
}
