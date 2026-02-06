/**
 * RIME COUTURE - Admin Tags API
 * ==============================
 * GET: Fetch all tags grouped by type
 * POST: Create a new tag with translations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Locale } from '@repo/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all tags grouped by type
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      include: {
        translations: true,
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });

    const formatted = tags.map((tag) => ({
      id: tag.id,
      type: tag.type,
      slug: tag.slug,
      sortOrder: tag.sortOrder,
      labels: Object.fromEntries(
        tag.translations.map((t) => [t.locale, t.label])
      ),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Admin tags error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, slug, labels } = body;

    if (!type || !slug) {
      return NextResponse.json(
        { success: false, error: 'Type and slug are required' },
        { status: 400 }
      );
    }

    // Check if tag already exists
    const existing = await prisma.tag.findUnique({
      where: { type_slug: { type, slug } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Tag already exists', data: { id: existing.id } },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        type,
        slug,
        translations: {
          create: Object.entries(labels || {}).map(([locale, label]) => ({
            locale: locale.toUpperCase() as Locale,
            label: label as string,
          })),
        },
      },
      include: { translations: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tag.id,
        type: tag.type,
        slug: tag.slug,
        labels: Object.fromEntries(
          tag.translations.map((t) => [t.locale, t.label])
        ),
      },
    });
  } catch (error) {
    console.error('Admin create tag error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
