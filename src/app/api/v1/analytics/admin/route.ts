import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/analytics/admin — admin dashboard metrics */
export async function GET() {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    totalPayments,
    totalShops,
    pendingWithdrawals,
    completedWithdrawals,
    products,
    orders,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'SELLER' } }),
    db.product.count(),
    db.order.count(),
    db.payment.count({ where: { status: 'SUCCESS' } }),
    db.shop.count(),
    db.withdrawal.count({ where: { status: 'PENDING' } }),
    db.withdrawal.count({ where: { status: 'COMPLETED' } }),
    db.product.findMany({
      select: { id: true, name: true, slug: true, price: true, soldCount: true, rating: true, stockAvailable: true, productType: true, status: true, shop: { select: { name: true } }, images: { take: 1, orderBy: { order: 'asc' } } },
      orderBy: { soldCount: 'desc' },
      take: 8,
    }),
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        sellerOrders: { include: { shop: { select: { name: true } } } },
      },
    }),
  ]);

  // Compute GMV (gross merchandise value) from all orders
  const allOrders = await db.order.findMany({ select: { subtotal: true, createdAt: true, paymentStatus: true } });
  const gmv = allOrders.reduce((s, o) => s + o.subtotal, 0);
  const totalPaid = allOrders.filter((o) => o.paymentStatus === 'SUCCESS').reduce((s, o) => s + o.subtotal, 0);
  // Commission = 5% of GMV
  const commission = Math.round(gmv * 0.05);
  const refunds = 0; // not tracked in MVP

  // 12-month chart
  const monthBuckets: { month: string; gmv: number; orders: number; commission: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets.push({ month: label, gmv: 0, orders: 0, commission: 0 });
  }
  for (const o of allOrders) {
    const d = new Date(o.createdAt);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = monthBuckets.find((m) => m.month === label);
    if (b) {
      b.gmv += o.subtotal;
      b.orders += 1;
      b.commission += Math.round(o.subtotal * 0.05);
    }
  }

  // Sales by product type
  const byType = await db.product.groupBy({
    by: ['productType'],
    _count: true,
    _sum: { soldCount: true },
  });

  // Top sellers
  const topSellers = await db.shop.findMany({
    take: 5,
    orderBy: { completedOrders: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      rating: true,
      ratingCount: true,
      completedOrders: true,
      productCount: true,
      followersCount: true,
      verified: true,
    },
  });

  return ok({
    metrics: {
      gmv,
      totalPaid,
      commission,
      refunds,
      totalUsers,
      totalSellers,
      totalShops,
      totalProducts,
      totalOrders,
      totalPayments,
      pendingWithdrawals,
      completedWithdrawals,
    },
    chart: monthBuckets,
    byType: byType.map((b) => ({ productType: b.productType, count: b._count, sold: b._sum.soldCount ?? 0 })),
    topSellers,
    recentProducts: products,
    recentOrders: orders,
  });
}
