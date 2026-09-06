import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveDemoUserId } from '@/lib/api/auth-resolver';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** GET /api/v1/seller/products?sellerId=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawSellerId = url.searchParams.get('sellerId');
  if (!rawSellerId) return ok({ items: [] });
  const sellerId = await resolveDemoUserId(rawSellerId);
  const items = await db.product.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      images: { take: 1, orderBy: { order: 'asc' } },
      category: { select: { name: true, slug: true } },
    },
  });
  return ok({ items });
}

/** POST /api/v1/seller/products — create a new product or open source project */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sellerId || !body?.name)
    return fail('sellerId and name required', 'VALIDATION_ERROR', 422);

  // Resolve demo seller ID to a real DB user
  const sellerId = await resolveDemoUserId(body.sellerId);

  // Resolve shopId: if seller doesn't have a shop yet (e.g. open source creator), auto-provision a creator shop
  let shopId = body.shopId;
  if (!shopId || shopId === 'demo-shop' || shopId === sellerId || shopId === 'creator-shop') {
    let shop = await db.shop.findUnique({ where: { sellerId } });
    if (!shop) {
      const user = await db.user.findUnique({ where: { id: sellerId } });
      const shopName = user?.name ? `${user.name}'s Studio` : 'Community Creator';
      const baseSlug = (user?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'creator');
      const shopSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      shop = await db.shop.create({
        data: {
          sellerId,
          name: shopName,
          slug: shopSlug,
          description: 'Open source hardware, KiCad designs & firmware',
          status: 'ACTIVE',
        },
      });
    }
    shopId = shop.id;
  }

  // Auto-fallback category if not provided
  let categoryId = body.categoryId;
  if (!categoryId) {
    const defaultCat = await db.category.findFirst({
      where: {
        OR: [
          { slug: 'open-source' },
          { slug: 'dev-boards' },
          { slug: 'components' },
        ],
      },
    });
    categoryId = defaultCat?.id;
  }

  // Parse price (0 is valid for free open source)
  const rawPrice = body.price;
  const parsedPrice = (rawPrice !== undefined && rawPrice !== null && rawPrice !== '')
    ? Math.max(0, parseInt(String(rawPrice), 10) || 0)
    : 0;

  const slug = (body.slug ?? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) + '-' + Math.random().toString(36).slice(2, 6);

  // Combine githubUrl into description if present
  let description = body.description || '';
  if (body.githubUrl && !description.includes(body.githubUrl)) {
    description = description ? `${description}\n\n**GitHub Repository:** ${body.githubUrl}` : `**GitHub Repository:** ${body.githubUrl}`;
  }

  const product = await db.product.create({
    data: {
      sellerId,
      shopId,
      categoryId,
      name: body.name,
      slug,
      productType: body.productType ?? 'PHYSICAL',
      shortDescription: body.shortDescription,
      description,
      sku: body.sku,
      mpn: body.mpn,
      brand: body.brand,
      price: parsedPrice,
      compareAtPrice: body.compareAtPrice ? parseInt(body.compareAtPrice, 10) : null,
      stockTotal: parseInt(body.stock ?? '0', 10),
      stockAvailable: parseInt(body.stock ?? '0', 10),
      unlimited: body.unlimited ?? (parsedPrice === 0 || body.productType === 'DIGITAL'),
      status: 'ACTIVE',
      // PCB
      pcbLayers: body.pcbLayers,
      pcbThickness: body.pcbThickness,
      pcbMaterial: body.pcbMaterial,
      pcbSurfaceFinish: body.pcbSurfaceFinish,
      pcbColor: body.pcbColor,
      pcbDimensions: body.pcbDimensions,
      // Digital
      software: body.software,
      softwareVersion: body.softwareVersion,
      currentVersion: body.currentVersion,
      fileFormat: body.fileFormat,
      licenseType: body.licenseType,
      // Service
      serviceScope: body.serviceScope,
      serviceDeliverables: body.serviceDeliverables,
      serviceDurationDays: body.serviceDurationDays,
      serviceRevisions: body.serviceRevisions,
    },
  });

  if (body.imageUrl) {
    await db.productImage.create({ data: { productId: product.id, url: body.imageUrl, order: 0 } });
  }

  await db.auditLog.create({
    data: { userId: sellerId, action: 'PRODUCT_CREATED', entityType: 'product', entityId: product.id, newValue: product.name },
  });

  return ok({ product }, 'Product created');
}
