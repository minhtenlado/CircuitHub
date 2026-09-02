import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/notifications?userId=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return ok({ items: [] });
  const items = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return ok({ items });
}

/** PATCH /api/v1/notifications — mark as read */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ success: false, message: 'id required' }, { status: 422 });
  await db.notification.update({ where: { id: body.id }, data: { read: true } });
  return ok({ id: body.id });
}
