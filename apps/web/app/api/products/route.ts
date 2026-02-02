/**
 * Products API Route
 * Secure, rate-limited product fetching using Prisma ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, type Prisma, Locale } from '@repo/db';
import {
  checkRateLimit,
  rateLimitResponse,
  checkForBot,
  validateLocale,
  validatePositiveInt,
  validateSlug,
  validateSortBy,
  validatePriceRange,
  validateCodeList,
  validateGender,
  validateKitchenType,
  validateSearchQuery,
} from '@/lib/api-security';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  inStock: boolean;
  isFeatured: boolean;
  category: string;
  categorySlug: string;
  colors: {
    code: string;
    hex: string | null;
    label: string;
  }[];
  sizes: {
    code: string;
    label: string;
  }[];
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========== SECURITY CHECKS ==========
    
    // Rate limiting (60 requests per minute per IP)
    const rateLimit = checkRateLimit(request, {
      windowMs: 60000,
      maxRequests: 60,
      keyPrefix: 'products',
    });
    
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }
    
    // Bot detection (block suspicious bots, allow search engines)
    const botCheck = checkForBot(request);
    if (botCheck.isSuspicious) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // ========== VALIDATE & SANITIZE INPUT ==========
    
    const searchParams = request.nextUrl.searchParams;
    
    // Validate all parameters
    const locale = validateLocale(searchParams.get('locale')) as Locale;
    const limit = validatePositiveInt(searchParams.get('limit'), 20, 100);
    const offset = validatePositiveInt(searchParams.get('offset'), 0, 10000);
    const page = validatePositiveInt(searchParams.get('page'), 1, 1000);
    const calculatedOffset = page > 1 ? (page - 1) * limit : offset;
    const featured = searchParams.get('featured') === 'true';
    const category = validateSlug(searchParams.get('category'));
    const sortBy = validateSortBy(searchParams.get('sort') || searchParams.get('sortBy'));
    const search = validateSearchQuery(searchParams.get('search'));
    
    // Filter parameters (all validated/sanitized)
    const sizes = validateCodeList(searchParams.get('sizes'));
    const colors = validateCodeList(searchParams.get('colors'));
    const priceRange = validatePriceRange(searchParams.get('priceRange'));
    const materials = validateCodeList(searchParams.get('materials'));
    const patterns = validateCodeList(searchParams.get('patterns'));
    const seasons = validateCodeList(searchParams.get('seasons'));
    const occasions = validateCodeList(searchParams.get('occasions'));
    const gender = validateGender(searchParams.get('gender'));
    const kitchenType = validateKitchenType(searchParams.get('kitchenType'));
    
    // ========== BUILD PRISMA QUERY ==========
    
    // Build WHERE conditions
    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      isActive: true,
      deletedAt: null,
    };
    
    if (featured) {
      where.isFeatured = true;
    }
    
    if (category) {
      where.category = {
        slug: category,
      };
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { slug: { contains: searchLower, mode: 'insensitive' } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: searchLower, mode: 'insensitive' } },
                { description: { contains: searchLower, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }
    
    // Price range filter
    if (priceRange) {
      switch (priceRange) {
        case 'under2000':
          where.basePriceMinor = { lt: 200000 };
          break;
        case '2000to5000':
          where.basePriceMinor = { gte: 200000, lt: 500000 };
          break;
        case '5000to10000':
          where.basePriceMinor = { gte: 500000, lt: 1000000 };
          break;
        case 'over10000':
          where.basePriceMinor = { gte: 1000000 };
          break;
      }
    }
    
    // Size filter
    if (sizes.length > 0) {
      where.variants = {
        some: {
          size: {
            code: { in: sizes },
          },
        },
      };
    }
    
    // Color filter
    if (colors.length > 0) {
      where.variants = {
        ...where.variants,
        some: {
          ...(where.variants as Prisma.ProductVariantListRelationFilter)?.some,
          color: {
            code: { in: colors },
          },
        },
      };
    }
    
    // Tag filters
    const allTags = [
      ...materials,
      ...patterns,
      ...seasons,
      ...occasions,
      ...(gender ? [gender] : []),
      ...(kitchenType ? [kitchenType] : []),
    ];
    if (allTags.length > 0) {
      where.tags = {
        some: {
          tag: {
            slug: { in: allTags },
          },
        },
      };
    }
    
    // Build ORDER BY
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'bestselling':
        orderBy = { salesCount: 'desc' };
        break;
      case 'price-asc':
        orderBy = { basePriceMinor: 'asc' };
        break;
      case 'price-desc':
        orderBy = { basePriceMinor: 'desc' };
        break;
      case 'rating':
        orderBy = { avgRating: 'desc' };
        break;
      case 'featured':
      default:
        orderBy = [
          { isFeatured: 'desc' },
          { featuredOrder: { sort: 'asc', nulls: 'last' } },
          { salesCount: 'desc' },
        ];
        break;
    }
    
    // ========== EXECUTE QUERIES ==========
    
    // Get products and count in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: calculatedOffset,
        include: {
          translations: true,
          category: {
            include: {
              translations: true,
            },
          },
          media: {
            where: { isThumb: true },
            include: {
              media: true,
            },
            orderBy: { position: 'asc' },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            include: {
              size: {
                include: {
                  translations: {
                    where: { locale },
                  },
                },
              },
              color: {
                include: {
                  translations: {
                    where: { locale },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    
    if (products.length === 0) {
      const response = NextResponse.json({
        success: true,
        products: [],
        total: 0,
        limit,
        offset: calculatedOffset,
        page,
        locale,
      });
      
      addSecurityHeaders(response, rateLimit.remaining, rateLimit.resetAt);
      return response;
    }
    
    // Format products
    const formattedProducts: ProductResponse[] = products.map((product: typeof products[number]) => {
      // Get translation for current locale
      const translation = product.translations.find((t: { locale: string }) => t.locale === locale)
        || product.translations.find((t: { locale: string }) => t.locale === 'EN')
        || product.translations[0];
      
      // Get category translation
      const catTranslation = product.category?.translations.find((t: { locale: string }) => t.locale === locale)
        || product.category?.translations.find((t: { locale: string }) => t.locale === 'EN')
        || product.category?.translations[0];
      
      // Get thumbnail
      const thumbMedia = product.media[0]?.media;
      
      // Extract unique colors and sizes
      const colorsMap = new Map<string, { code: string; hex: string | null; label: string }>();
      const sizesMap = new Map<string, { code: string; label: string }>();
      let totalStock = 0;
      
      for (const variant of product.variants) {
        totalStock += variant.stock || 0;
        
        if (variant.color && !colorsMap.has(variant.color.code)) {
          const colorTrans = variant.color.translations[0];
          colorsMap.set(variant.color.code, {
            code: variant.color.code,
            hex: variant.color.hex,
            label: colorTrans?.label || variant.color.code,
          });
        }
        
        if (variant.size && !sizesMap.has(variant.size.code)) {
          const sizeTrans = variant.size.translations[0];
          sizesMap.set(variant.size.code, {
            code: variant.size.code,
            label: sizeTrans?.label || variant.size.code,
          });
        }
      }
      
      return {
        id: product.id,
        slug: product.slug,
        name: translation?.name || product.slug,
        description: translation?.description || '',
        price: product.basePriceMinor,
        currency: product.currency,
        imageUrl: thumbMedia?.url || '',
        rating: product.avgRating,
        reviewCount: product.reviewCount,
        salesCount: product.salesCount,
        inStock: totalStock > 0,
        isFeatured: product.isFeatured,
        category: catTranslation?.name || product.category?.slug || '',
        categorySlug: product.category?.slug || '',
        colors: Array.from(colorsMap.values()),
        sizes: Array.from(sizesMap.values()),
      };
    });
    
    const response = NextResponse.json({
      success: true,
      products: formattedProducts,
      total,
      limit,
      offset: calculatedOffset,
      page,
      locale,
    });
    
    addSecurityHeaders(response, rateLimit.remaining, rateLimit.resetAt);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
    
  } catch (error) {
    console.error('Products API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'An error occurred',
      },
      { status: 500 }
    );
  }
}

function addSecurityHeaders(response: NextResponse, remaining: number, resetAt: number): void {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}
