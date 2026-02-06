/**
 * RIME COUTURE - Admin Sizes API
 * ===============================
 * GET: Fetch all available sizes for variant management
 */

import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      select: {
        id: true,
        code: true,
        translations: {
          select: {
            locale: true,
            label: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const formatted = sizes.map((size) => ({
      id: size.id,
      code: size.code,
      label:
        size.translations.find((t) => t.locale === 'EN')?.label ||
        size.translations.find((t) => t.locale === 'FR')?.label ||
        size.code,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Sizes fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}
