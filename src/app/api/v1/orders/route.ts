import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail } from '../route';

/** POST /api/v1/orders — create order from cart payload.
 * Frontend sends only the items + address + payment/shipping method.
 * Backend recalculates ALL financial values (never trust client).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0)
    return fail('Cart is empty', 'CART_EMPTY', 422);

  const userId = body.userId ?? 'demo-buyer'; // demo
  const voucherCode: string | undefined = body.voucherCode;
  const paymentMethod = body.paymentMethod ?? 'MOCK';
  const shippingMethod = body.shippingMethod ?? 'STANDARD';

  // Resolve products from DB (server-side source of truth)
  const productIds = body.items.map((i: any) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { shop: true },
  });
  if (products.length !== productIds.length)
    return fail('Some products are no longer available', 'PRODUCT_UNAVAILABLE', 422);

  // Group by shop → seller orders
  type Resolved = { product: any; qty: number };
  const resolved: Resolved[] = body.items.map((i: any) => ({
    product: products.find((p) => p.id === i.productId)!,
    qty: Math.max(1, parseInt(i.quantity, 10) || 1),
  }));

  // Stock check
  for (const r of resolved) {
    if (!r.product.unlimited && r.product.stockAvailable < r.qty)
      return fail(
        `Insufficient stock for ${r.product.name} (available: ${r.product.stockAvailable})`,
        'OUT_OF_STOCK',
        422,
      );
  }

  // Group by shop
  const groups = new Map<string, Resolved[]>();
  for (const r of resolved) {
    if (!groups.has(r.product.shopId)) groups.set(r.product.shopId, []);
    groups.get(r.product.shopId)!.push(r);
  }

  const COMMISSION_RATE = 0.05;

  // Compute seller order values
  const sellerOrdersPayload = Array.from(groups.entries()).map(([shopId, items]) => {
    const subtotal = items.reduce((s, r) => s + r.product.price * r.qty, 0);
    const shipping = items.some((r) => r.product.productType === 'PHYSICAL') ? 30000 : 0;
    const commissionAmount = Math.round(subtotal * COMMISSION_RATE);
    const sellerRevenue = subtotal - commissionAmount;
    const fulfillmentType = items.every((r) => r.product.productType === 'DIGITAL')
      ? 'DIGITAL'
      : items.every((r) => r.product.productType === 'SERVICE')
        ? 'SERVICE'
        : 'PHYSICAL';
    return { shopId, sellerId: items[0].product.shop.sellerId, subtotal, shipping, commissionAmount, sellerRevenue, items, fulfillmentType };
  });

  const subtotal = sellerOrdersPayload.reduce((s, so) => s + so.subtotal, 0);
  const shippingTotal = sellerOrdersPayload.reduce((s, so) => s + so.shipping, 0);
  let discountTotal = 0;

  // Voucher validation (server-side)
  let appliedVoucher: any = null;
  if (voucherCode) {
    const v = await db.voucher.findUnique({ where: { code: voucherCode } });
    if (!v || v.status !== 'ACTIVE') return fail('Invalid voucher', 'VOUCHER_INVALID', 422);
    if (v.startDate > new Date()) return fail('Voucher not yet active', 'VOUCHER_NOT_ACTIVE', 422);
    if (v.endDate && v.endDate < new Date()) return fail('Voucher expired', 'VOUCHER_EXPIRED', 422);
    if (subtotal < v.minOrder) return fail(`Min order ${v.minOrder} required`, 'VOUCHER_MIN_ORDER', 422);

    if (v.discountType === 'PERCENTAGE') {
      discountTotal = Math.round((subtotal * v.discountValue) / 100);
      if (v.maxDiscount) discountTotal = Math.min(discountTotal, v.maxDiscount);
    } else {
      discountTotal = v.discountValue;
    }
  }

  const grandTotal = Math.max(0, subtotal - discountTotal + shippingTotal);

  // Persist
  const order = await db.order.create({
    data: {
      code: `CH-${Date.now().toString().slice(-6)}`,
      userId,
      status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PAID',
      subtotal,
      discountTotal,
      shippingTotal,
      grandTotal,
      paymentMethod,
      paymentStatus: 'SUCCESS',
      shippingAddress: JSON.stringify(body.address ?? {}),
    },
  });

  for (const so of sellerOrdersPayload) {
    const sellerOrder = await db.sellerOrder.create({
      data: {
        orderId: order.id,
        sellerId: so.sellerId,
        shopId: so.shopId,
        code: `${order.code}-${so.shopId.slice(-4)}`,
        status: paymentMethod === 'COD' ? 'CONFIRMED' : 'CONFIRMED',
        subtotal: so.subtotal,
        shippingTotal: so.shipping,
        commissionRate: COMMISSION_RATE,
        commissionAmount: so.commissionAmount,
        sellerRevenue: so.sellerRevenue,
        fulfillmentType: so.fulfillmentType,
      },
    });
    for (const r of so.items) {
      await db.orderItem.create({
        data: {
          orderId: order.id,
          sellerOrderId: sellerOrder.id,
          productId: r.product.id,
          name: r.product.name,
          sku: r.product.sku,
          productType: r.product.productType,
          unitPrice: r.product.price,
          quantity: r.qty,
          lineTotal: r.product.price * r.qty,
          imageUrl: r.product.images?.[0]?.url,
          fulfillmentType: so.fulfillmentType,
        },
      });
      // Decrement stock
      if (!r.product.unlimited) {
        await db.product.update({
          where: { id: r.product.id },
          data: {
            stockAvailable: { decrement: r.qty },
            stockTotal: { decrement: r.qty },
            soldCount: { increment: r.qty },
          },
        });
      }
      // Add to wallet pending balance (settlement after completion)
      await db.wallet.upsert({
        where: { sellerId: so.sellerId },
        create: { sellerId: so.sellerId, pendingBalance: r.product.price * r.qty },
        update: { pendingBalance: { increment: r.product.price * r.qty } },
      });
    }
  }

  // Payment record
  await db.payment.create({
    data: {
      orderId: order.id,
      provider: paymentMethod,
      amount: grandTotal,
      status: 'SUCCESS',
      transactionCode: `MOCK-${order.code}`,
      paidAt: new Date(),
    },
  });

  // Notification to buyer
  await db.notification.create({
    data: {
      userId,
      type: 'ORDER_CREATED',
      title: `Order ${order.code} placed`,
      body: `Your order total is ${grandTotal.toLocaleString('vi-VN')}₫. Payment: ${paymentMethod}.`,
      link: '#/orders',
    },
  });

  // If voucher applied, increment usage
  if (appliedVoucher) {
    await db.voucher.update({
      where: { id: appliedVoucher.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  return ok({ order, grandTotal }, 'Order created successfully');
}

/** GET /api/v1/orders?userId=... — list user's orders */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId') ?? 'demo-buyer';
  const role = url.searchParams.get('role'); // 'seller' or 'admin'
  let orders: any[] = [];
  if (role === 'seller') {
    // Seller orders
    orders = await db.sellerOrder.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { shop: true, items: { include: { product: { include: { images: true } } } }, order: true },
    });
  } else if (role === 'admin') {
    orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        sellerOrders: { include: { shop: true } },
        items: true,
      },
    });
  } else {
    orders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: { include: { product: { include: { images: true } } } },
        sellerOrders: { include: { shop: true } },
        shipments: true,
        payments: true,
      },
    });
  }
  return ok({ items: orders });
}
