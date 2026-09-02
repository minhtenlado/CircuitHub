import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
export function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** GET /api/v1/seller/products?sellerId=... */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sellerId = url.searchParams.get('sellerId');
  if (!sellerId) return ok({ items: [] });
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

/** POST /api/v1/seller/products — create a new product (seller onboarding) */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sellerId || !body?.shopId || !body?.name || !body?.price)
    return fail('sellerId, shopId, name, price required', 'VALIDATION_ERROR', 422);

  const slug = (body.slug ?? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) + '-' + Math.random().toString(36).slice(2, 6);
  const product = await db.product.create({
    data: {
      sellerId: body.sellerId,
      shopId: body.shopId,
      categoryId: body.categoryId,
      name: body.name,
      slug,
      productType: body.productType ?? 'PHYSICAL',
      shortDescription: body.shortDescription,
      description: body.description,
      sku: body.sku,
      mpn: body.mpn,
      brand: body.brand,
      price: parseInt(body.price, 10),
      compareAtPrice: body.compareAtPrice ? parseInt(body.compareAtPrice, 10) : null,
      stockTotal: parseInt(body.stock ?? '0', 10),
      stockAvailable: parseInt(body.stock ?? '0', 10),
      unlimited: body.unlimited ?? false,
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
    data: { userId: body.sellerId, action: 'PRODUCT_CREATED', entityType: 'product', entityId: product.id, newValue: product.name },
  });

  return ok({ product }, 'Product created');
}
