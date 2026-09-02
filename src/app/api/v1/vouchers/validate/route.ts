import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** POST /api/v1/vouchers/validate — validate a voucher against a cart subtotal */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.code) return fail('Voucher code required', 'VOUCHER_CODE_REQUIRED', 422);
  const subtotal = Math.max(0, parseInt(body.subtotal ?? '0', 10));

  const v = await db.voucher.findUnique({ where: { code: body.code.toUpperCase() } });
  if (!v || v.status !== 'ACTIVE') return fail('Voucher not found', 'VOUCHER_NOT_FOUND', 404);
  if (v.startDate > new Date()) return fail('Voucher not active yet', 'VOUCHER_NOT_ACTIVE', 422);
  if (v.endDate && v.endDate < new Date()) return fail('Voucher expired', 'VOUCHER_EXPIRED', 422);
  if (subtotal < v.minOrder)
    return fail(`Min order ${v.minOrder.toLocaleString('vi-VN')}₫ required`, 'VOUCHER_MIN_ORDER', 422);
  if (v.totalUsageLimit && v.usedCount >= v.totalUsageLimit)
    return fail('Voucher usage limit reached', 'VOUCHER_EXHAUSTED', 422);

  let discount = 0;
  if (v.discountType === 'PERCENTAGE') {
    discount = Math.round((subtotal * v.discountValue) / 100);
    if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
  } else {
    discount = v.discountValue;
  }

  return ok({ code: v.code, name: v.name, discountType: v.discountType, discount });
}
