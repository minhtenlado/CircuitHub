import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  hashPassword,
  generateSecureToken,
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogin,
} from '@/lib/security';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

const ADMIN_CONF_PASSWORD = '!@#$%^&*()123456789';

/** POST /api/v1/auth/login */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return fail('Email/Tài khoản và Mật khẩu là bắt buộc', 'AUTH_REQUIRED', 422);
  }

  const rawInput = String(body.email).trim();
  const password = String(body.password);
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const rateLimitKey = `${clientIp}:${rawInput.toLowerCase()}`;

  // 1. Kiểm tra chống tấn công dò mật khẩu (Brute-force rate limit)
  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return fail(
      `Tài khoản tạm thời bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateLimit.remainingSeconds} giây.`,
      'RATE_LIMITED',
      429,
    );
  }

  // 2. Xử lý định danh tài khoản (Hỗ trợ cả "admin" và "admin@circuithub.vn")
  const isAdminAlias = rawInput.toLowerCase() === 'admin' || rawInput.toLowerCase() === 'admin@circuithub.vn';
  const lookupEmail = isAdminAlias ? 'admin@circuithub.vn' : rawInput.toLowerCase();

  let user = await db.user.findFirst({
    where: {
      OR: [
        { email: lookupEmail },
        { email: rawInput.toLowerCase() },
      ],
    },
    include: { shop: { select: { id: true, slug: true, name: true } } },
  });

  // 3. Tự động khởi tạo/cập nhật tài khoản Admin theo mật khẩu cấu hình nếu người dùng đăng nhập tài khoản Admin
  if (isAdminAlias && password === ADMIN_CONF_PASSWORD) {
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'admin@circuithub.vn',
          passwordHash: hashPassword(ADMIN_CONF_PASSWORD),
          name: 'System Administrator',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          status: 'ACTIVE',
          avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA&backgroundColor=06b6d4',
        },
        include: { shop: { select: { id: true, slug: true, name: true } } },
      });
    } else if (!verifyPassword(ADMIN_CONF_PASSWORD, user.passwordHash)) {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(ADMIN_CONF_PASSWORD),
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
        include: { shop: { select: { id: true, slug: true, name: true } } },
      });
    }
  }

  if (!user) {
    recordFailedLogin(rateLimitKey);
    return fail('Tài khoản không tồn tại', 'USER_NOT_FOUND', 404);
  }

  // 4. Xác thực mật khẩu an toàn với Scrypt Salted Hash + Timing Attack Protection
  const isValidPassword = verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    const { blocked, attemptsLeft } = recordFailedLogin(rateLimitKey);
    if (blocked) {
      return fail(
        'Bạn đã nhập sai mật khẩu 5 lần. Tài khoản bị tạm khóa 5 phút để bảo vệ an toàn.',
        'RATE_LIMITED',
        429,
      );
    }
    return fail(
      `Mật khẩu không chính xác. Bạn còn ${attemptsLeft} lần thử trước khi bị khóa tạm thời.`,
      'INVALID_PASSWORD',
      401,
    );
  }

  if (user.status !== 'ACTIVE') {
    return fail('Tài khoản đã bị tạm khóa hoặc đình chỉ', 'ACCOUNT_SUSPENDED', 403);
  }

  // 5. Đăng nhập thành công: Xóa bộ đếm sai & Cấp token bảo mật 256-bit
  clearFailedLogin(rateLimitKey);
  const secureToken = generateSecureToken();

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
    token: secureToken,
  }, 'Đăng nhập thành công');
}
