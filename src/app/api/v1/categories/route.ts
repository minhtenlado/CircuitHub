import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export function ok<T>(data: T, message = 'Success') {
  return NextResponse.json({ success: true, data, message });
}

/** GET /api/v1/categories */
export async function GET() {
  let cats = await db.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  if (cats.length === 0) {
    try {
      await seedDatabase();
      cats = await db.category.findMany({
        orderBy: { order: 'asc' },
        include: { _count: { select: { products: true } } },
      });
    } catch (e) {
      console.error('Auto seed error:', e);
    }
  }

  // Build tree
  const map = new Map(cats.map((c) => [c.id, { ...c, children: [] as any[] }]));
  const tree: any[] = [];
  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(c);
    else tree.push(c);
  }
  return ok(tree);
}
