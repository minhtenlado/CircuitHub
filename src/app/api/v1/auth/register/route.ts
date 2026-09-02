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

/** POST /api/v1/auth/register */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name)
    return fail('Email, password, name required', 'AUTH_REQUIRED', 422);

  const exists = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (exists) return fail('Email already registered', 'EMAIL_TAKEN', 409);

  const user = await db.user.create({
    data: {
      email: body.email.toLowerCase(),
      name: body.name,
      passwordHash: hash(body.password),
      role: 'BUYER',
      emailVerified: false,
    },
  });

  return ok(
    {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: `demo-token-${user.id}-${Date.now()}`,
    },
    'Account created successfully',
  );
}
