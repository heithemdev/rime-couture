/**
 * RIME COUTURE - Admin Colors API
 * ================================
 * GET: Fetch all available colors for variant management
 */

import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      select: {
        id: true,
        code: true,
        hex: true,
        translations: {
          select: {
            locale: true,
            label: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const formatted = colors.map((color) => ({
      id: color.id,
      code: color.code,
      hex: color.hex,
      label:
        color.translations.find((t) => t.locale === 'EN')?.label ||
        color.translations.find((t) => t.locale === 'FR')?.label ||
        color.code,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Colors fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}
