import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveDemoUserId } from '@/lib/api/auth-resolver';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}
function fail(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, message, code }, { status });
}

/** PATCH /api/v1/admin/products — approve/reject a product
 * Body: { productId, action, reason? }
 * action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'FEATURE' | 'UNFEATURE'
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.action)
    return fail('productId and action required', 'VALIDATION_ERROR', 422);

  const product = await db.product.findUnique({ where: { id: body.productId } });
  if (!product) return fail('Product not found', 'PRODUCT_NOT_FOUND', 404);

  const validActions = ['APPROVE', 'REJECT', 'SUSPEND', 'FEATURE', 'UNFEATURE'];
  if (!validActions.includes(body.action))
    return fail(`Invalid action. Must be one of: ${validActions.join(', ')}`, 'INVALID_ACTION', 422);

  // Determine new status
  let newStatus = product.status;
  let moderationNote: string | null = null;
  let isFeatured = product.isFeatured;

  if (body.action === 'APPROVE') {
    newStatus = 'ACTIVE';
    moderationNote = null;
  } else if (body.action === 'REJECT') {
    if (!body.reason?.trim()) return fail('Reason is required for rejection', 'REASON_REQUIRED', 422);
    newStatus = 'REJECTED';
    moderationNote = body.reason.trim();
  } else if (body.action === 'SUSPEND') {
    newStatus = 'SUSPENDED';
    moderationNote = body.reason?.trim() ?? 'Suspended by admin';
  } else if (body.action === 'FEATURE') {
    isFeatured = true;
  } else if (body.action === 'UNFEATURE') {
    isFeatured = false;
  }

  const updated = await db.product.update({
    where: { id: body.productId },
    data: {
      status: newStatus,
      moderationNote,
      isFeatured,
    },
  });

  // Create audit log
  const adminId = await resolveDemoUserId(body.adminId ?? 'demo-admin');
  await db.auditLog.create({
    data: {
      userId: adminId,
      action: `PRODUCT_${body.action}`,
      entityType: 'product',
      entityId: product.id,
      oldValue: product.status,
      newValue: newStatus,
    },
  });

  // Notify the seller
  await db.notification.create({
    data: {
      userId: product.sellerId,
      type: body.action === 'APPROVE' ? 'PRODUCT_APPROVED' : body.action === 'REJECT' ? 'PRODUCT_REJECTED' : 'PRODUCT_SUSPENDED',
      title: `Product ${body.action === 'APPROVE' ? 'approved' : body.action === 'REJECT' ? 'rejected' : 'suspended'}`,
      body: body.action === 'REJECT'
        ? `Your product "${product.name}" was rejected. Reason: ${body.reason}`
        : `Your product "${product.name}" is now ${newStatus.toLowerCase()}.`,
      link: '#/seller/products',
    },
  });

  return ok({
    productId: product.id,
    action: body.action,
    previousStatus: product.status,
    newStatus,
    moderationNote,
    isFeatured,
  });
}
