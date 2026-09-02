import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/admin/users?role=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const role = url.searchParams.get('role');
  const where: any = {};
  if (role) where.role = role;
  const users = await db.user.findMany({
    where,
    take: 100,
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, status: true, emailVerified: true, avatarUrl: true, createdAt: true, shop: { select: { id: true, name: true, slug: true, verified: true, status: true } } },
  });
  return ok({ items: users });
}
