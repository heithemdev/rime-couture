/**
 * RIME COUTURE - Admin Categories API
 * ====================================
 * Fetch all categories for admin product form
 */

import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale: 'EN' },
          select: { name: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.translations[0]?.name || 'Unnamed Category',
    }));

    return NextResponse.json({ success: true, data: formattedCategories });
  } catch (error) {
    console.error('Admin categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
