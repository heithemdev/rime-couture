/**
 * Favorites API Route
 * GET: Fetch products liked by a user (by fingerprint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Locale } from '@repo/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fingerprint = searchParams.get('fingerprint');
  const locale = (searchParams.get('locale') || 'EN').toUpperCase() as Locale;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));

  if (!fingerprint || fingerprint.length < 10) {
    return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });
  }

  try {
    // Get total count of liked products
    const totalCount = await prisma.productLike.count({
      where: {
        fingerprint,
        product: {
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
      },
    });

    // Fetch liked products with full data
    const likes = await prisma.productLike.findMany({
      where: {
        fingerprint,
        product: {
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            slug: true,
            basePriceMinor: true,
            originalPriceMinor: true,
            discountPercent: true,
            likeCount: true,
            salesCount: true,
            isActive: true,
            translations: {
              where: { locale },
              select: { name: true, description: true },
            },
            media: {
              where: { isThumb: true },
              take: 1,
              select: { media: { select: { url: true } } },
            },
            category: {
              select: {
                slug: true,
                translations: {
                  where: { locale },
                  select: { name: true },
                },
              },
            },
            variants: {
              select: {
                id: true,
                variantKey: true,
                sku: true,
                priceMinor: true,
                stock: true,
                sizeId: true,
                colorId: true,
                size: { select: { id: true, code: true, translations: { where: { locale }, select: { label: true } } } },
                color: { select: { id: true, code: true, hex: true, translations: { where: { locale }, select: { label: true } } } },
              },
            },
            reviews: { select: { rating: true } },
          },
        },
      },
    });

    // Get top 10 product IDs by salesCount for isTopSeller badge
    const topSellers = await prisma.product.findMany({
      where: { status: 'PUBLISHED', isActive: true, deletedAt: null, salesCount: { gt: 0 } },
      orderBy: { salesCount: 'desc' },
      take: 10,
      select: { id: true },
    });
    const topSellerIds = new Set(topSellers.map(p => p.id));

    const products = likes.map(like => {
      const p = like.product;
      const translation = p.translations[0];
      const thumbUrl = p.media[0]?.media?.url || '/assets/placeholder.webp';
      const reviews = p.reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      const priceDA = p.basePriceMinor / 100;

      // Unique sizes and colors
      const sizesMap = new Map<string, { id: string; code: string; label: string }>();
      const colorsMap = new Map<string, { id: string; code: string; hex: string | null; label: string }>();

      for (const v of p.variants) {
        if (v.size) sizesMap.set(v.size.id, { id: v.size.id, code: v.size.code, label: v.size.translations[0]?.label || v.size.code });
        if (v.color) colorsMap.set(v.color.id, { id: v.color.id, code: v.color.code, hex: v.color.hex, label: v.color.translations[0]?.label || v.color.code });
      }

      return {
        id: p.id,
        slug: p.slug,
        name: translation?.name || 'Unnamed',
        description: translation?.description || '',
        price: priceDA,
        originalPrice: p.originalPriceMinor ? p.originalPriceMinor / 100 : undefined,
        discountPercent: p.discountPercent || undefined,
        currency: 'DZD',
        imageUrl: thumbUrl,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        likeCount: p.likeCount,
        salesCount: p.salesCount,
        inStock: totalStock > 0,
        isTopSeller: topSellerIds.has(p.id),
        category: p.category?.translations[0]?.name || '',
        categorySlug: p.category?.slug || '',
        sizes: Array.from(sizesMap.values()),
        colors: Array.from(colorsMap.values()),
        variants: p.variants.map(v => ({
          id: v.id,
          variantKey: v.variantKey,
          sku: v.sku,
          price: v.priceMinor ? v.priceMinor / 100 : null,
          stock: v.stock,
          sizeId: v.sizeId,
          colorId: v.colorId,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total: totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 },
    );
  }
}
