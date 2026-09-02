import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/admin/audit-logs */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
  const logs = await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, avatarUrl: true } } },
  });
  return ok({ items: logs });
}
