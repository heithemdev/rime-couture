/**
 * Filters API Route
 * Returns available filter options (colors, sizes, materials, etc.) using Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Locale } from '@repo/db';
import {
  checkRateLimit,
  rateLimitResponse,
  checkForBot,
  validateLocale,
} from '@/lib/api-security';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = checkRateLimit(request, {
      windowMs: 60000,
      maxRequests: 60,
      keyPrefix: 'filters',
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    // Bot detection
    const botCheck = checkForBot(request);
    if (botCheck.isSuspicious) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = validateLocale(searchParams.get('locale')) as Locale;

    // Check cache
    const cacheKey = `filters:${locale}`;
    const cached = getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all filter data in parallel using Prisma
    const [colors, sizes, tags, categories] = await Promise.all([
      // Colors with translations
      prisma.color.findMany({
        where: { isActive: true },
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Sizes with translations
      prisma.size.findMany({
        where: { isActive: true },
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Tags (materials, patterns, seasons, occasions) with translations
      prisma.tag.findMany({
        where: { isActive: true },
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Categories with translations
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Format colors
    const formattedColors = colors.map((c: typeof colors[number]) => ({
      code: c.code,
      hex: c.hex,
      label: c.translations[0]?.label || c.code,
    }));

    // Format sizes
    const formattedSizes = sizes.map((s: typeof sizes[number]) => ({
      code: s.code,
      label: s.translations[0]?.label || s.code,
    }));

    // Group tags by type
    const tagsByType = {
      materials: [] as Array<{ slug: string; label: string }>,
      patterns: [] as Array<{ slug: string; label: string }>,
      seasons: [] as Array<{ slug: string; label: string }>,
      occasions: [] as Array<{ slug: string; label: string }>,
      gender: [] as Array<{ slug: string; label: string }>,
      kitchenType: [] as Array<{ slug: string; label: string }>,
    };

    for (const tag of tags) {
      const tagType = tag.type.toLowerCase();
      const formattedTag = {
        slug: tag.slug,
        label: tag.translations[0]?.label || tag.slug,
      };

      if (tagType === 'material') {
        tagsByType.materials.push(formattedTag);
      } else if (tagType === 'pattern') {
        tagsByType.patterns.push(formattedTag);
      } else if (tagType === 'season' || tagType === 'mood_season') {
        tagsByType.seasons.push(formattedTag);
      } else if (tagType === 'occasion') {
        tagsByType.occasions.push(formattedTag);
      } else if (tagType === 'gender') {
        tagsByType.gender.push(formattedTag);
      } else if (tagType === 'kitchen' || tagType === 'kitchentype') {
        tagsByType.kitchenType.push(formattedTag);
      }
    }

    // Format categories
    const formattedCategories = categories.map((c: typeof categories[number]) => ({
      slug: c.slug,
      name: c.translations[0]?.name || c.slug,
    }));

    const responseData = {
      success: true,
      filters: {
        colors: formattedColors,
        sizes: formattedSizes,
        materials: tagsByType.materials,
        patterns: tagsByType.patterns,
        seasons: tagsByType.seasons,
        occasions: tagsByType.occasions,
        gender: tagsByType.gender,
        kitchenType: tagsByType.kitchenType,
        categories: formattedCategories,
        priceRanges: [
          { value: 'under2000', label: locale === 'AR' ? 'أقل من 2000 دج' : 'Under 2000 DZD' },
          { value: '2000to5000', label: locale === 'AR' ? '2000 - 5000 دج' : '2000 - 5000 DZD' },
          { value: '5000to10000', label: locale === 'AR' ? '5000 - 10000 دج' : '5000 - 10000 DZD' },
          { value: 'over10000', label: locale === 'AR' ? 'أكثر من 10000 دج' : 'Over 10000 DZD' },
        ],
      },
      locale,
    };

    // Cache the response
    setCache(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Filters API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filters',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An error occurred',
      },
      { status: 500 }
    );
  }
}
