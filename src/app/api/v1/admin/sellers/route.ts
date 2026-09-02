import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/admin/sellers — list all sellers with shop info */
export async function GET() {
  const sellers = await db.user.findMany({
    where: { role: 'SELLER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      status: true,
      shop: true,
    },
  });
  return ok({ items: sellers });
}

/** PATCH /api/v1/admin/sellers — approve/suspend shop */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.shopId || !body?.action)
    return NextResponse.json({ success: false, message: 'shopId, action required' }, { status: 422 });

  const shop = await db.shop.findUnique({ where: { id: body.shopId } });
  if (!shop) return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });

  if (body.action === 'APPROVE') {
    await db.shop.update({ where: { id: shop.id }, data: { verified: true, verifiedAt: new Date(), status: 'ACTIVE' } });
    await db.auditLog.create({
      data: { userId: 'demo-admin', action: 'SELLER_APPROVED', entityType: 'shop', entityId: shop.id, oldValue: 'PENDING_REVIEW', newValue: 'ACTIVE' },
    });
    await db.notification.create({
      data: { userId: shop.sellerId, type: 'SELLER_APPROVED', title: 'Your shop is approved!', body: 'You can now publish products on CircuitHub.', link: '#/seller' },
    });
  } else if (body.action === 'SUSPEND') {
    await db.shop.update({ where: { id: shop.id }, data: { status: 'SUSPENDED', verified: false } });
    await db.auditLog.create({
      data: { userId: 'demo-admin', action: 'SELLER_SUSPENDED', entityType: 'shop', entityId: shop.id, oldValue: 'ACTIVE', newValue: 'SUSPENDED' },
    });
  } else if (body.action === 'REACTIVATE') {
    await db.shop.update({ where: { id: shop.id }, data: { status: 'ACTIVE' } });
  }

  return ok({ shopId: shop.id, action: body.action });
}
