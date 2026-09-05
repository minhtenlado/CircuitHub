import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateSecureToken } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  let vercelShare: string | null = null;
  let originalCallbackUrl: string | null = null;
  if (state) {
    try {
      const parsed = JSON.parse(state);
      if (parsed.vercelShare) vercelShare = parsed.vercelShare;
      if (parsed.callbackUrl) originalCallbackUrl = parsed.callbackUrl;
    } catch {}
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;
  // Use character-identical callbackUrl from state to guarantee 0% redirect_uri_mismatch
  const callbackUrl = originalCallbackUrl || `${baseUrl}/api/v1/auth/google/callback`;

  const makeRedirect = (params: Record<string, string>) => {
    const target = new URL(`${baseUrl}/`);
    Object.entries(params).forEach(([k, v]) => target.searchParams.set(k, v));
    if (vercelShare) target.searchParams.set('_vercel_share', vercelShare);
    return target.toString();
  };

  if (error || !code) {
    const errorMsg = error || 'Không nhận được mã ủy quyền từ Google';
    return NextResponse.redirect(makeRedirect({ google_auth: 'error', message: errorMsg }));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      makeRedirect({
        google_auth: 'error',
        message: 'GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình trên Vercel',
      }),
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
      let errorDetail = 'Không thể đổi mã xác thực với Google';
      try {
        const errJson = JSON.parse(errText);
        errorDetail = errJson.error_description || errJson.error || errText;
      } catch {
        errorDetail = errText;
      }
      return NextResponse.redirect(
        makeRedirect({
          google_auth: 'error',
          message: `Lỗi Google: ${errorDetail}`,
        }),
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Lấy thông tin tài khoản người dùng từ Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const userErrText = await userRes.text().catch(() => '');
      return NextResponse.redirect(
        makeRedirect({
          google_auth: 'error',
          message: `Không thể lấy thông tin Google: ${userErrText}`,
        }),
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
    const targetUrl = makeRedirect({
      google_auth: 'success',
      token: secureToken,
      user: JSON.stringify(userPayload),
    });

    const response = NextResponse.redirect(targetUrl);
    response.cookies.set('circuithub_token', secureToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    // Lỗi có thể do Unicode trong tên người dùng (Văn Đỗ) làm crash khi set cookie header
    response.cookies.set('circuithub_user', encodeURIComponent(JSON.stringify(userPayload)), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('Google Callback Error:', err);
    return NextResponse.redirect(
      makeRedirect({
        google_auth: 'error',
        message: err?.message || 'Lỗi xử lý xác thực',
      }),
    );
  }
}
