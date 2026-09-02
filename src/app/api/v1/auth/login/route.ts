import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

function hash(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

/** POST /api/v1/auth/login */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) return fail('Email and password required', 'AUTH_REQUIRED', 422);

  const user = await db.user.findUnique({
    where: { email: body.email.toLowerCase() },
    include: { shop: { select: { id: true, slug: true, name: true } } },
  });
  if (!user) return fail('Account not found', 'USER_NOT_FOUND', 404);
  if (user.passwordHash !== hash(body.password)) return fail('Invalid password', 'INVALID_PASSWORD', 401);
  if (user.status !== 'ACTIVE') return fail('Account suspended', 'ACCOUNT_SUSPENDED', 403);

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      shopId: user.shop?.id,
      shopSlug: user.shop?.slug,
    },
    token: `demo-token-${user.id}-${Date.now()}`,
  });
}
