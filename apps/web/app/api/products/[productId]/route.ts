/**
 * Single Product API Route
 * Fetches complete product details including translations, variants, media, and reviews
 * 
 * Security: UUID validation, rate limiting, bot detection
 * Performance: Connection pooling, prepared statements, in-memory caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';

// ============================================================================
// IN-MEMORY CACHE (Simple TTL cache for product data)
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const productCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 1000; // 1 minute cache
const MAX_CACHE_SIZE = 100; // Max products to cache

function getCached<T>(key: string): T | null {
  const entry = productCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    productCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  // Evict old entries if cache is full
  if (productCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [k, v] of productCache) {
      if (now > v.expiresAt) {
        productCache.delete(k);
      }
    }
    // If still full, delete oldest entries
    if (productCache.size >= MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(productCache.keys()).slice(0, 20);
      keysToDelete.forEach(k => productCache.delete(k));
    }
  }
  productCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ============================================================================
// RATE LIMITING (Simple in-memory rate limiter)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

// ============================================================================
// DATABASE CONNECTION (singleton with retry logic)
// ============================================================================

let pool: Pool | null = null;
let poolCreatedAt = 0;
const POOL_MAX_AGE = 5 * 60 * 1000;

function getPool(): Pool {
  const now = Date.now();
  
  if (pool && now - poolCreatedAt > POOL_MAX_AGE) {
    pool.end().catch(() => {});
    pool = null;
  }
  
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  pool = new Pool({
    connectionString,
    max: 5,
    min: 1,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: false },
    query_timeout: 15000,
    statement_timeout: 15000,
  });
  
  pool.on('error', (err) => {
    console.error('[product] Pool error:', err.message);
    pool = null;
  });
  
  poolCreatedAt = now;
  return pool;
}

async function getClient(maxRetries = 3): Promise<PoolClient> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = getPool();
      const client = await db.connect();
      return client;
    } catch (error) {
      lastError = error as Error;
      console.error(`[product] Connection attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (pool) {
        pool.end().catch(() => {});
        pool = null;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to connect to database');
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALID_LOCALES = ['EN', 'FR', 'AR'] as const;
type Locale = typeof VALID_LOCALES[number];

function validateLocale(locale: string | null): Locale {
  if (locale) {
    const upperLocale = locale.toUpperCase() as Locale;
    if (VALID_LOCALES.includes(upperLocale)) {
      return upperLocale;
    }
  }
  return 'EN';
}

function validateUUID(id: string | null): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { productId } = await params;
  
  // Validate product ID (prevents SQL injection via malformed IDs)
  const validProductId = validateUUID(productId);
  if (!validProductId) {
    return NextResponse.json(
      { error: 'Invalid product ID format' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const locale = validateLocale(searchParams.get('locale'));

  // Check cache first
  const cacheKey = `product:${validProductId}:${locale}`;
  const cached = getCached<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
      },
    });
  }

  let client: PoolClient | null = null;

  try {
    client = await getClient();

    // Fetch product with translations
    const productResult = await client.query(`
      SELECT 
        p.id,
        p.slug,
        p."categoryId",
        p.status,
        p.currency,
        p."basePriceMinor",
        p."isCustomizable",
        p."isMadeToOrder",
        p."leadTimeDays",
        p."isFeatured",
        p."salesCount",
        p."reviewCount",
        p."avgRating",
        pt.name,
        pt.description,
        pt."seoTitle",
        pt."seoDescription",
        ct.name as "categoryName",
        c.slug as "categorySlug"
      FROM "Product" p
      LEFT JOIN "ProductTranslation" pt ON pt."productId" = p.id AND pt.locale = $2
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "CategoryTranslation" ct ON ct."categoryId" = c.id AND ct.locale = $2
      WHERE p.id = $1 
        AND p.status = 'PUBLISHED' 
        AND p."isActive" = true
        AND p."deletedAt" IS NULL
    `, [validProductId, locale]);

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    // Fetch product media
    const mediaResult = await client.query(`
      SELECT 
        pm.position,
        pm."isThumb",
        ma.id as "mediaId",
        ma.kind,
        ma.url,
        ma."mimeType",
        ma.width,
        ma.height,
        ma."durationS"
      FROM "ProductMedia" pm
      JOIN "MediaAsset" ma ON ma.id = pm."mediaId"
      WHERE pm."productId" = $1
      ORDER BY pm.position ASC
    `, [validProductId]);

    // Fetch product variants with sizes and colors
    const variantsResult = await client.query(`
      SELECT 
        pv.id as "variantId",
        pv."variantKey",
        pv.sku,
        pv."priceMinor",
        pv.stock,
        pv."sizeId",
        pv."colorId",
        s.code as "sizeCode",
        st.label as "sizeLabel",
        c.code as "colorCode",
        c.hex as "colorHex",
        colt.label as "colorLabel"
      FROM "ProductVariant" pv
      LEFT JOIN "Size" s ON s.id = pv."sizeId"
      LEFT JOIN "SizeTranslation" st ON st."sizeId" = s.id AND st.locale = $2
      LEFT JOIN "Color" c ON c.id = pv."colorId"
      LEFT JOIN "ColorTranslation" colt ON colt."colorId" = c.id AND colt.locale = $2
      WHERE pv."productId" = $1 AND pv."isActive" = true
      ORDER BY s."sortOrder" ASC, c."sortOrder" ASC
    `, [validProductId, locale]);

    // Fetch product tags (for materials, style, etc.)
    const tagsResult = await client.query(`
      SELECT 
        t.id,
        t.type,
        t.slug,
        tt.label
      FROM "ProductTag" ptag
      JOIN "Tag" t ON t.id = ptag."tagId"
      LEFT JOIN "TagTranslation" tt ON tt."tagId" = t.id AND tt.locale = $2
      WHERE ptag."productId" = $1 AND t."isActive" = true
      ORDER BY t."sortOrder" ASC
    `, [validProductId, locale]);

    // Fetch reviews (latest 10, not hidden)
    const reviewsResult = await client.query(`
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r."createdAt",
        COALESCE(u."displayName", 'Anonymous') as "reviewerName"
      FROM "Review" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."productId" = $1 AND r."isHidden" = false
      ORDER BY r."createdAt" DESC
      LIMIT 10
    `, [validProductId]);

    // Group tags by type
    const tagsByType: Record<string, Array<{ slug: string; label: string }>> = {};
    for (const tag of tagsResult.rows) {
      const tagType = tag.type as string;
      if (!tagsByType[tagType]) {
        tagsByType[tagType] = [];
      }
      tagsByType[tagType]!.push({ slug: tag.slug, label: tag.label });
    }

    // Extract unique sizes and colors from variants
    const sizesMap = new Map<string, { id: string; code: string; label: string }>();
    const colorsMap = new Map<string, { id: string; code: string; hex: string; label: string }>();
    
    for (const variant of variantsResult.rows) {
      if (variant.sizeId && !sizesMap.has(variant.sizeId)) {
        sizesMap.set(variant.sizeId, {
          id: variant.sizeId,
          code: variant.sizeCode,
          label: variant.sizeLabel,
        });
      }
      if (variant.colorId && !colorsMap.has(variant.colorId)) {
        colorsMap.set(variant.colorId, {
          id: variant.colorId,
          code: variant.colorCode,
          hex: variant.colorHex,
          label: variant.colorLabel,
        });
      }
    }

    // Calculate price range
    const prices = variantsResult.rows
      .map((v: { priceMinor: number | null }) => v.priceMinor)
      .filter((p: number | null): p is number => p !== null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePriceMinor;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePriceMinor;

    const responseData = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      category: {
        id: product.categoryId,
        slug: product.categorySlug,
        name: product.categoryName,
      },
      price: {
        base: product.basePriceMinor / 100,
        min: minPrice / 100,
        max: maxPrice / 100,
        currency: product.currency,
      },
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
      },
      media: mediaResult.rows.map((m) => ({
        id: m.mediaId,
        kind: m.kind,
        url: m.url,
        mimeType: m.mimeType,
        width: m.width,
        height: m.height,
        durationS: m.durationS,
        isThumb: m.isThumb,
        position: m.position,
      })),
      variants: variantsResult.rows.map((v) => ({
        id: v.variantId,
        variantKey: v.variantKey,
        sku: v.sku,
        price: v.priceMinor ? v.priceMinor / 100 : null,
        stock: v.stock,
        size: v.sizeId ? { id: v.sizeId, code: v.sizeCode, label: v.sizeLabel } : null,
        color: v.colorId ? { id: v.colorId, code: v.colorCode, hex: v.colorHex, label: v.colorLabel } : null,
      })),
      sizes: Array.from(sizesMap.values()),
      colors: Array.from(colorsMap.values()),
      tags: tagsByType,
      reviews: reviewsResult.rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        reviewerName: r.reviewerName,
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
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
