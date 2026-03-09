/**
 * Product Data Access — Direct DB queries for server components
 * Avoids self-fetching API routes (unreliable on Vercel serverless)
 */

import { prisma } from '@repo/db';
import { resolveHex } from '@/lib/constants';

const VALID_LOCALES = ['en', 'ar', 'fr', 'EN', 'AR', 'FR'] as const;

function normalizeLocale(locale: string): string {
  if (VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) {
    return locale.toUpperCase();
  }
  return 'AR';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(productId: string, rawLocale: string) {
  if (!UUID_REGEX.test(productId)) return null;

  const locale = normalizeLocale(rawLocale);

  // Retry up to 2 times on transient DB connection errors
  const MAX_RETRIES = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
        include: {
          translations: true,
          category: {
            include: { translations: true },
          },
          media: {
            include: { media: true },
            orderBy: { position: 'asc' },
          },
          variants: {
            where: { isActive: true },
            include: {
              size: { include: { translations: true } },
              color: { include: { translations: true } },
            },
          },
          tags: {
            include: {
              tag: { include: { translations: true } },
            },
          },
          reviews: {
            where: { isHidden: false },
            include: {
              user: {
                select: { displayName: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!product) return null;

    // Resolve translations
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
        if (!tagsByType[tag.type]) tagsByType[tag.type] = [];
        const tagTranslation =
          tag.translations.find((t) => t.locale === locale) ||
          tag.translations.find((t) => t.locale === 'EN') ||
          tag.translations[0];
        tagsByType[tag.type]!.push({
          slug: tag.slug,
          label: tagTranslation?.label || tag.slug,
        });
      }
    }

    // Extract unique sizes and colors
    const sizesMap = new Map<string, { id: string; code: string; label: string }>();
    const colorsMap = new Map<string, { id: string; code: string; hex: string | null; label: string }>();

    for (const variant of product.variants) {
      if (variant.size && !sizesMap.has(variant.size.id)) {
        const st =
          variant.size.translations.find((t) => t.locale === locale) ||
          variant.size.translations.find((t) => t.locale === 'EN') ||
          variant.size.translations[0];
        sizesMap.set(variant.size.id, {
          id: variant.size.id,
          code: variant.size.code,
          label: st?.label || variant.size.code,
        });
      }
      if (variant.color && !colorsMap.has(variant.color.id)) {
        const ct =
          variant.color.translations.find((t) => t.locale === locale) ||
          variant.color.translations.find((t) => t.locale === 'EN') ||
          variant.color.translations[0];
        colorsMap.set(variant.color.id, {
          id: variant.color.id,
          code: variant.color.code,
          hex: resolveHex(variant.color.code, variant.color.hex),
          label: ct?.label || variant.color.code,
        });
      }
    }

    // Price range
    const prices = product.variants.map((v) => v.priceMinor).filter((p): p is number => p !== null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePriceMinor;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePriceMinor;

    return {
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
            ? { id: v.size.id, code: v.size.code, label: sizeTrans?.label || v.size.code }
            : null,
          color: v.color
            ? { id: v.color.id, code: v.color.code, hex: resolveHex(v.color.code, v.color.hex), label: colorTrans?.label || v.color.code }
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
        avatarUrl: r.user?.avatarUrl || null,
        createdAt: r.createdAt,
      })),
    };
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : '';
      const isTransient = msg.includes('Connection') ||
        msg.includes('timeout') ||
        msg.includes('ECONNRESET') ||
        msg.includes('pool') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('connect');

      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(`[getProductById] Transient DB error (attempt ${attempt + 1}), retrying...`, msg);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      // Non-transient or exhausted retries — throw so the page can show a proper error
      console.error('[getProductById] DB error:', error);
      throw error;
    }
  }

  // Should not reach here, but just in case
  throw lastError;
}
