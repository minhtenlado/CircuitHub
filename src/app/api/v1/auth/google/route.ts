import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateSecureToken } from '@/lib/security';

function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
  email_verified?: boolean | string;
}

/**
 * GET /api/v1/auth/google
 * Khởi tạo quá trình chuyển hướng đến trang đăng nhập Google OAuth 2.0
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return fail(
      'GOOGLE_CLIENT_ID chưa được cấu hình. Vui lòng thiết lập biến môi trường GOOGLE_CLIENT_ID trong Vercel.',
      'GOOGLE_CLIENT_ID_MISSING',
      500,
    );
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const callbackUrl = `${proto}://${host}/api/v1/auth/google/callback`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}

/**
 * POST /api/v1/auth/google
 * Xác thực Google token (Credential JWT từ Google Identity Services hoặc Access Token)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const credential = body?.credential;
  const accessToken = body?.accessToken;

  if (!credential && !accessToken) {
    return fail('Thiếu mã xác thực Google (credential hoặc accessToken)', 'TOKEN_REQUIRED', 422);
  }

  let userInfo: GoogleUserInfo | null = null;

  try {
    // 1. Xác thực bằng Google ID Token (Credential JWT)
    if (credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { cache: 'no-store' },
      );
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        userInfo = {
          email: data.email,
          name: data.name || data.email?.split('@')[0] || 'Google User',
          picture: data.picture,
          sub: data.sub,
          email_verified: data.email_verified === 'true' || data.email_verified === true,
        };
      }
    }

    // 2. Xác thực bằng Google OAuth2 Access Token (nếu không có credential)
    if (!userInfo && accessToken) {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      if (userinfoRes.ok) {
        const data = await userinfoRes.json();
        userInfo = {
          email: data.email,
          name: data.name || data.email?.split('@')[0] || 'Google User',
          picture: data.picture,
          sub: data.sub,
          email_verified: data.email_verified,
        };
      }
    }

    if (!userInfo || !userInfo.email) {
      return fail('Xác thực với máy chủ Google thất bại hoặc mã token không hợp lệ', 'INVALID_GOOGLE_TOKEN', 401);
    }

    const email = userInfo.email.toLowerCase().trim();
    const name = userInfo.name || email.split('@')[0];
    const avatarUrl = userInfo.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=06b6d4`;

    // 3. Tìm hoặc Tạo mới tài khoản người dùng
    let user = await db.user.findUnique({
      where: { email },
      include: { shop: { select: { id: true, slug: true, name: true } } },
    });

    if (!user) {
      // Đăng ký mới tự động với tài khoản Google
      user = await db.user.create({
        data: {
          email,
          name,
          avatarUrl,
          passwordHash: hashPassword(generateSecureToken()),
          role: 'BUYER',
          status: 'ACTIVE',
          emailVerified: true,
        },
        include: { shop: { select: { id: true, slug: true, name: true } } },
      });

      // Tạo giỏ hàng và danh sách yêu thích mặc định
      await Promise.allSettled([
        db.cart.create({ data: { userId: user.id } }),
        db.wishlist.create({ data: { userId: user.id } }),
      ]);
    } else {
      // Cập nhật thông tin nếu cần (avatar, trạng thái xác thực email)
      if (!user.avatarUrl && avatarUrl) {
        user = await db.user.update({
          where: { id: user.id },
          data: { avatarUrl, emailVerified: true },
          include: { shop: { select: { id: true, slug: true, name: true } } },
        });
      }
    }

    if (user.status !== 'ACTIVE') {
      return fail('Tài khoản đã bị đình chỉ hoặc vô hiệu hóa', 'ACCOUNT_SUSPENDED', 403);
    }

    // 4. Tạo token phiên làm việc an toàn
    const secureToken = generateSecureToken();

    return ok(
      {
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
      },
      'Đăng nhập Google thành công',
    );
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return fail('Lỗi xử lý xác thực Google: ' + (error?.message || 'Unknown error'), 'GOOGLE_AUTH_ERROR', 500);
  }
}
