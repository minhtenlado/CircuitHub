import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/analytics/seller?sellerId=... — seller dashboard metrics */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sellerId = url.searchParams.get('sellerId') ?? 'demo-seller';

  const [wallet, products, orders, withdrawals, reviews] = await Promise.all([
    db.wallet.findUnique({ where: { sellerId } }),
    db.product.findMany({
      where: { sellerId },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
      orderBy: { soldCount: 'desc' },
      take: 5,
    }),
    db.sellerOrder.findMany({
      where: { sellerId },
      include: { items: true, order: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.withdrawal.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.review.findMany({ where: { shop: { sellerId } }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, avatarUrl: true } } } }),
  ]);

  // Compute metrics from orders
  const totalRevenue = orders.reduce((s, o) => s + o.sellerRevenue, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commissionAmount, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PACKING').length;
  const shippingOrders = orders.filter((o) => o.status === 'SHIPPING').length;
  const totalItemsSold = orders.reduce((s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0), 0);

  // Build a 12-month revenue chart (synthetic from last 12 months using created orders)
  const monthBuckets: { month: string; revenue: number; orders: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets.push({ month: label, revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = monthBuckets.find((m) => m.month === label);
    if (b) {
      b.revenue += o.sellerRevenue;
      b.orders += 1;
    }
  }

  // Top products by soldCount
  const topProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    soldCount: p.soldCount,
    stockAvailable: p.stockAvailable,
    rating: p.rating,
    imageUrl: p.images?.[0]?.url,
  }));

  const lowStock = await db.product.findMany({
    where: { sellerId, stockAvailable: { lt: 20 }, unlimited: false },
    take: 5,
    select: { id: true, name: true, slug: true, stockAvailable: true, price: true },
  });

  return ok({
    wallet,
    metrics: {
      totalRevenue,
      totalCommission,
      totalOrders,
      completedOrders,
      pendingOrders,
      shippingOrders,
      totalItemsSold,
      productCount: products.length,
      lowStockCount: lowStock.length,
    },
    topProducts,
    lowStock,
    recentOrders: orders.slice(0, 5),
    withdrawals,
    reviews,
    chart: monthBuckets,
  });
}
