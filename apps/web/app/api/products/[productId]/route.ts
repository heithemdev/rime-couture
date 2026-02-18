//apps/web/app/api/products/[productId]/route.ts
/**
 * Single Product API Route
 * Fetches complete product details using Prisma ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getCache, setCache } from '@/lib/cache';
import { resolveHex } from '@/lib/constants';

// Valid locale validation
const VALID_LOCALES = ['en', 'ar', 'fr', 'EN', 'AR', 'FR'] as const;

function validateLocale(locale: string | null): string {
  if (locale && VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) {
    return locale.toUpperCase();
  }
  return 'AR';
}

// UUID validation
function validateUUID(id: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

// Rate limiting with in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 60;

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Rate limiting check
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { productId } = await params;

  // Validate product ID
  const validProductId = validateUUID(productId);
  if (!validProductId) {
    return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const locale = validateLocale(searchParams.get('locale'));

  // Check cache first
  const cacheKey = `product:${validProductId}:${locale}`;
  const cached = getCache<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    // Fetch product with all related data using Prisma
    const product = await prisma.product.findFirst({
      where: {
        id: validProductId,
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true,
          },
        },
        media: {
          include: {
            media: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            size: {
              include: {
                translations: true,
              },
            },
            color: {
              include: {
                translations: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        reviews: {
          where: { isHidden: false },
          include: {
            user: {
              select: {
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get translation for locale
    const translation =
      product.translations.find((t) => t.locale === locale) ||
      product.translations.find((t) => t.locale === 'EN') ||
      product.translations[0];

    const categoryTranslation =
      product.category?.translations.find((t) => t.locale === locale) ||
      product.category?.translations.find((t) => t.locale === 'EN') ||
      product.category?.translations[0];

    // Group tags by type
    const tagsByType: Record<string, Array<{ slug: string; label: string }>> = {};
    for (const productTag of product.tags) {
      const tag = productTag.tag;
      if (tag.isActive) {
        const tagType = tag.type;
        if (!tagsByType[tagType]) {
          tagsByType[tagType] = [];
        }
        const tagTranslation =
          tag.translations.find((t) => t.locale === locale) ||
          tag.translations.find((t) => t.locale === 'EN') ||
          tag.translations[0];
        tagsByType[tagType]!.push({
          slug: tag.slug,
          label: tagTranslation?.label || tag.slug,
        });
      }
    }

    // Extract unique sizes and colors from variants
    const sizesMap = new Map<string, { id: string; code: string; label: string }>();
    const colorsMap = new Map<string, { id: string; code: string; hex: string | null; label: string }>();

    for (const variant of product.variants) {
      if (variant.size && !sizesMap.has(variant.size.id)) {
        const sizeTranslation =
          variant.size.translations.find((t) => t.locale === locale) ||
          variant.size.translations.find((t) => t.locale === 'EN') ||
          variant.size.translations[0];
        sizesMap.set(variant.size.id, {
          id: variant.size.id,
          code: variant.size.code,
          label: sizeTranslation?.label || variant.size.code,
        });
      }
      if (variant.color && !colorsMap.has(variant.color.id)) {
        const colorTranslation =
          variant.color.translations.find((t) => t.locale === locale) ||
          variant.color.translations.find((t) => t.locale === 'EN') ||
          variant.color.translations[0];
        colorsMap.set(variant.color.id, {
          id: variant.color.id,
          code: variant.color.code,
          hex: resolveHex(variant.color.code, variant.color.hex),
          label: colorTranslation?.label || variant.color.code,
        });
      }
    }

    // Calculate price range
    const prices = product.variants.map((v) => v.priceMinor).filter((p): p is number => p !== null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePriceMinor;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePriceMinor;

    const responseData = {
      id: product.id,
      slug: product.slug,
      name: translation?.name || product.slug,
      description: translation?.description || null,
      seoTitle: translation?.seoTitle || null,
      seoDescription: translation?.seoDescription || null,
      category: product.category
        ? {
            id: product.category.id,
            slug: product.category.slug,
            name: categoryTranslation?.name || product.category.slug,
          }
        : null,
      price: {
        base: Math.round(product.basePriceMinor / 100),
        min: Math.round(minPrice / 100),
        max: Math.round(maxPrice / 100),
        currency: product.currency,
      },
      originalPrice: product.originalPriceMinor ? Math.round(product.originalPriceMinor / 100) : null,
      discountPercent: product.discountPercent ?? null,
      flags: {
        isCustomizable: product.isCustomizable,
        isMadeToOrder: product.isMadeToOrder,
        isFeatured: product.isFeatured,
      },
      leadTimeDays: product.leadTimeDays,
      stats: {
        salesCount: product.salesCount,
        reviewCount: product.reviewCount,
        avgRating: product.avgRating,
        likeCount: product.likeCount,
      },
      media: product.media.map((pm) => ({
        id: pm.media.id,
        kind: pm.media.kind,
        url: pm.media.url,
        mimeType: pm.media.mimeType,
        width: pm.media.width,
        height: pm.media.height,
        durationS: pm.media.durationS,
        isThumb: pm.isThumb,
        position: pm.position,
        colorId: pm.colorId || null,
      })),
      variants: product.variants.map((v) => {
        const sizeTrans =
          v.size?.translations.find((t) => t.locale === locale) ||
          v.size?.translations.find((t) => t.locale === 'EN') ||
          v.size?.translations[0];
        const colorTrans =
          v.color?.translations.find((t) => t.locale === locale) ||
          v.color?.translations.find((t) => t.locale === 'EN') ||
          v.color?.translations[0];

        return {
          id: v.id,
          variantKey: v.variantKey,
          sku: v.sku,
          price: v.priceMinor ? Math.round(v.priceMinor / 100) : null,
          stock: v.stock,
          size: v.size
            ? {
                id: v.size.id,
                code: v.size.code,
                label: sizeTrans?.label || v.size.code,
              }
            : null,
          color: v.color
            ? {
                id: v.color.id,
                code: v.color.code,
                hex: resolveHex(v.color.code, v.color.hex),
                label: colorTrans?.label || v.color.code,
              }
            : null,
        };
      }),
      sizes: Array.from(sizesMap.values()),
      colors: Array.from(colorsMap.values()),
      tags: tagsByType,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        reviewerName: r.reviewerName || r.user?.displayName || 'Anonymous',
        createdAt: r.createdAt,
      })),
    };

    // Cache the response
    setCache(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[product] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
