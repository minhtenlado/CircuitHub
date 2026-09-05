import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateSecureToken } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;
  const callbackUrl = `${baseUrl}/api/v1/auth/google/callback`;

  if (error || !code) {
    const errorMsg = error || 'Không nhận được mã ủy quyền từ Google';
    return NextResponse.redirect(`${baseUrl}/?google_auth=error&message=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=error&message=${encodeURIComponent(
        'GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình trên Vercel',
      )}`,
    );
  }

  try {
    // 1. Đổi authorization code lấy access_token và id_token từ Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', errText);
      return NextResponse.redirect(
        `${baseUrl}/?google_auth=error&message=${encodeURIComponent('Không thể đổi mã xác thực với máy chủ Google')}`,
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Lấy thông tin tài khoản người dùng từ Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        `${baseUrl}/?google_auth=error&message=${encodeURIComponent('Không thể lấy thông tin hồ sơ Google')}`,
      );
    }

    const googleUser = await userRes.json();
    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || email.split('@')[0];
    const avatarUrl = googleUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=06b6d4`;

    // 3. Tìm hoặc tạo tài khoản người dùng
    let user = await db.user.findUnique({
      where: { email },
      include: { shop: { select: { id: true, slug: true, name: true } } },
    });

    if (!user) {
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

      await Promise.allSettled([
        db.cart.create({ data: { userId: user.id } }),
        db.wishlist.create({ data: { userId: user.id } }),
      ]);
    } else {
      if (!user.avatarUrl && avatarUrl) {
        user = await db.user.update({
          where: { id: user.id },
          data: { avatarUrl, emailVerified: true },
          include: { shop: { select: { id: true, slug: true, name: true } } },
        });
      }
    }

    // 4. Tạo token phiên làm việc
    const secureToken = generateSecureToken();
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      shopId: user.shop?.id,
      shopSlug: user.shop?.slug,
    };

    // 5. Chuyển hướng người dùng về trang chủ với thông tin xác thực
    const redirectTarget = new URL(`${baseUrl}/`);
    redirectTarget.searchParams.set('google_auth', 'success');
    redirectTarget.searchParams.set('token', secureToken);
    redirectTarget.searchParams.set('user', JSON.stringify(userPayload));

    return NextResponse.redirect(redirectTarget.toString());
  } catch (err: any) {
    console.error('Google Callback Error:', err);
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=error&message=${encodeURIComponent(err?.message || 'Lỗi xử lý xác thực')}`,
    );
  }
}
