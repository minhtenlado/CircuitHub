import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Initialization failed' },
      { status: 500 },
    );
  }
}
