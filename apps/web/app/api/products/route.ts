/**
 * Products API Route
 * Secure, rate-limited product fetching with SQL injection prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
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
// DATABASE CONNECTION (singleton with retry logic)
// ============================================================================

let pool: Pool | null = null;
let poolCreatedAt = 0;
const POOL_MAX_AGE = 5 * 60 * 1000; // Recreate pool every 5 minutes max

function getPool(): Pool {
  const now = Date.now();
  
  // Recreate pool if it's too old (helps with connection issues)
  if (pool && now - poolCreatedAt > POOL_MAX_AGE) {
    pool.end().catch(() => {}); // Clean up old pool
    pool = null;
  }
  
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  pool = new Pool({
    connectionString,
    max: 5, // Reduced to prevent connection exhaustion
    min: 1, // Keep at least 1 connection alive
    idleTimeoutMillis: 60000, // 1 minute idle timeout
    connectionTimeoutMillis: 15000, // 15 seconds to connect (increased)
    ssl: {
      rejectUnauthorized: false,
    },
    // Query timeout
    query_timeout: 15000, // 15 seconds per query
    statement_timeout: 15000,
  });
  
  pool.on('error', (err) => {
    console.error('[products] Pool error:', err.message);
    // Reset pool on error to force reconnection
    pool = null;
  });
  
  pool.on('connect', () => {
    console.log('[products] New connection established');
  });
  
  poolCreatedAt = now;
  return pool;
}

// Connect with retry logic
async function getClient(maxRetries = 3): Promise<PoolClient> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = getPool();
      const client = await db.connect();
      return client;
    } catch (error) {
      lastError = error as Error;
      console.error(`[products] Connection attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      // Reset pool on connection failure
      if (pool) {
        pool.end().catch(() => {});
        pool = null;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to connect to database');
}

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
  let client: PoolClient | null = null;
  
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
    
    // Validate all parameters (prevents SQL injection)
    const locale = validateLocale(searchParams.get('locale'));
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
    
    // ========== DATABASE QUERY ==========
    
    client = await getClient();
    
    // Build WHERE conditions using parameterized queries only
    const conditions: string[] = [
      `p.status = 'PUBLISHED'`,
      `p."isActive" = true`,
      `p."deletedAt" IS NULL`
    ];
    const params: (string | number | string[])[] = [];
    let paramIndex = 1;
    
    if (featured) {
      conditions.push(`p."isFeatured" = true`);
    }
    
    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    
    // Search filter - searches product name, description (all languages), and slug
    if (search) {
      conditions.push(`(
        LOWER(p.slug) LIKE $${paramIndex}
        OR EXISTS (
          SELECT 1 FROM "ProductTranslation" pt_search
          WHERE pt_search."productId" = p.id
          AND (
            LOWER(pt_search.name) LIKE $${paramIndex}
            OR LOWER(pt_search.description) LIKE $${paramIndex}
          )
        )
      )`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }
    
    // Price range filter (no user input in query, just pre-defined ranges)
    if (priceRange) {
      switch (priceRange) {
        case 'under2000':
          conditions.push(`p."basePriceMinor" < 200000`);
          break;
        case '2000to5000':
          conditions.push(`p."basePriceMinor" >= 200000 AND p."basePriceMinor" < 500000`);
          break;
        case '5000to10000':
          conditions.push(`p."basePriceMinor" >= 500000 AND p."basePriceMinor" < 1000000`);
          break;
        case 'over10000':
          conditions.push(`p."basePriceMinor" >= 1000000`);
          break;
      }
    }
    
    // Size filter - parameterized query
    if (sizes.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "ProductVariant" pv 
        JOIN "Size" sz ON pv."sizeId" = sz.id 
        WHERE pv."productId" = p.id AND sz.code = ANY($${paramIndex})
      )`);
      params.push(sizes);
      paramIndex++;
    }
    
    // Color filter - parameterized query
    if (colors.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "ProductVariant" pv 
        JOIN "Color" cl ON pv."colorId" = cl.id 
        WHERE pv."productId" = p.id AND cl.code = ANY($${paramIndex})
      )`);
      params.push(colors);
      paramIndex++;
    }
    
    // Tag filters - parameterized query
    // Gender maps to tags: 'boy' or 'girl'
    // KitchenType maps to tags: 'items' (table items) or 'mama' (aprons, etc.)
    const allTags = [
      ...materials, 
      ...patterns, 
      ...seasons, 
      ...occasions,
      ...(gender ? [gender] : []),
      ...(kitchenType ? [kitchenType] : []),
    ];
    if (allTags.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "ProductTag" pt 
        JOIN "Tag" t ON pt."tagId" = t.id 
        WHERE pt."productId" = p.id AND t.slug = ANY($${paramIndex})
      )`);
      params.push(allTags);
      paramIndex++;
    }
    
    // Build ORDER BY (only pre-defined options, not user input)
    let orderBy: string;
    switch (sortBy) {
      case 'newest':
        orderBy = `p."createdAt" DESC`;
        break;
      case 'bestselling':
        orderBy = `p."salesCount" DESC`;
        break;
      case 'price-asc':
        orderBy = `p."basePriceMinor" ASC`;
        break;
      case 'price-desc':
        orderBy = `p."basePriceMinor" DESC`;
        break;
      case 'rating':
        orderBy = `p."avgRating" DESC`;
        break;
      case 'featured':
      default:
        orderBy = `p."isFeatured" DESC, p."featuredOrder" ASC NULLS LAST, p."salesCount" DESC`;
        break;
    }
    
    // Main query - all user input is parameterized
    const productsQuery = `
      SELECT 
        p.id,
        p.slug,
        p."basePriceMinor",
        p.currency,
        p."avgRating",
        p."reviewCount",
        p."salesCount",
        p."isFeatured",
        c.slug as "categorySlug"
      FROM "Product" p
      INNER JOIN "Category" c ON p."categoryId" = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, calculatedOffset);
    
    const productsResult = await client.query(productsQuery, params);
    const products = productsResult.rows;
    
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
    
    const productIds = products.map((p: { id: string }) => p.id);
    const categorySlugs = [...new Set(products.map((p: { categorySlug: string }) => p.categorySlug))];
    
    // Fetch related data in parallel
    const [translationsResult, categoryTransResult, mediaResult, variantsResult] = await Promise.all([
      client.query(`
        SELECT "productId", locale, name, description
        FROM "ProductTranslation"
        WHERE "productId" = ANY($1)
      `, [productIds]),
      
      client.query(`
        SELECT c.slug as "categorySlug", ct.locale, ct.name
        FROM "Category" c
        JOIN "CategoryTranslation" ct ON c.id = ct."categoryId"
        WHERE c.slug = ANY($1)
      `, [categorySlugs]),
      
      client.query(`
        SELECT pm."productId", ma.url, pm."isThumb"
        FROM "ProductMedia" pm
        JOIN "MediaAsset" ma ON pm."mediaId" = ma.id
        WHERE pm."productId" = ANY($1) AND pm."isThumb" = true
        ORDER BY pm.position ASC
      `, [productIds]),
      
      client.query(`
        SELECT 
          pv."productId",
          pv.stock,
          col.code as "colorCode",
          col.hex as "colorHex",
          colt.label as "colorLabel",
          s.code as "sizeCode",
          st.label as "sizeLabel"
        FROM "ProductVariant" pv
        LEFT JOIN "Color" col ON pv."colorId" = col.id
        LEFT JOIN "ColorTranslation" colt ON col.id = colt."colorId" AND colt.locale = $2
        LEFT JOIN "Size" s ON pv."sizeId" = s.id
        LEFT JOIN "SizeTranslation" st ON s.id = st."sizeId" AND st.locale = $2
        WHERE pv."productId" = ANY($1) AND pv."isActive" = true
      `, [productIds, locale])
    ]);
    
    // Build lookup maps
    const translationsMap = new Map<string, { locale: string; name: string; description: string }[]>();
    for (const t of translationsResult.rows) {
      const arr = translationsMap.get(t.productId) || [];
      arr.push(t);
      translationsMap.set(t.productId, arr);
    }
    
    const categoryTransMap = new Map<string, { locale: string; name: string }[]>();
    for (const ct of categoryTransResult.rows) {
      const arr = categoryTransMap.get(ct.categorySlug) || [];
      arr.push(ct);
      categoryTransMap.set(ct.categorySlug, arr);
    }
    
    const mediaMap = new Map<string, { url: string; isThumb: boolean }[]>();
    for (const m of mediaResult.rows) {
      const arr = mediaMap.get(m.productId) || [];
      arr.push(m);
      mediaMap.set(m.productId, arr);
    }
    
    interface VariantRow {
      productId: string;
      stock: number;
      colorCode: string | null;
      colorHex: string | null;
      colorLabel: string | null;
      sizeCode: string | null;
      sizeLabel: string | null;
    }
    
    const variantsMap = new Map<string, VariantRow[]>();
    for (const v of variantsResult.rows) {
      const arr = variantsMap.get(v.productId) || [];
      arr.push(v);
      variantsMap.set(v.productId, arr);
    }
    
    // Format products
    const formattedProducts: ProductResponse[] = products.map((product: {
      id: string;
      slug: string;
      basePriceMinor: number;
      currency: string;
      avgRating: number;
      reviewCount: number;
      salesCount: number;
      isFeatured: boolean;
      categorySlug: string;
    }) => {
      const translations = translationsMap.get(product.id) || [];
      const translation = translations.find(t => t.locale === locale)
        || translations.find(t => t.locale === 'EN')
        || translations[0];
      
      const catTranslations = categoryTransMap.get(product.categorySlug) || [];
      const catTranslation = catTranslations.find(t => t.locale === locale)
        || catTranslations.find(t => t.locale === 'EN')
        || catTranslations[0];
      
      const mediaList = mediaMap.get(product.id) || [];
      const thumbMedia = mediaList.find(m => m.isThumb) || mediaList[0];
      
      const variants = variantsMap.get(product.id) || [];
      
      const colorsMap = new Map<string, { code: string; hex: string | null; label: string }>();
      for (const v of variants) {
        if (v.colorCode && !colorsMap.has(v.colorCode)) {
          colorsMap.set(v.colorCode, {
            code: v.colorCode,
            hex: v.colorHex,
            label: v.colorLabel || v.colorCode,
          });
        }
      }
      
      const sizesMap = new Map<string, { code: string; label: string }>();
      for (const v of variants) {
        if (v.sizeCode && !sizesMap.has(v.sizeCode)) {
          sizesMap.set(v.sizeCode, {
            code: v.sizeCode,
            label: v.sizeLabel || v.sizeCode,
          });
        }
      }
      
      const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      
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
        category: catTranslation?.name || product.categorySlug,
        categorySlug: product.categorySlug,
        colors: Array.from(colorsMap.values()),
        sizes: Array.from(sizesMap.values()),
      };
    });
    
    // Get total count
    const countConditions = conditions.slice();
    const countParams = params.slice(0, params.length - 2);
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM "Product" p
      JOIN "Category" c ON p."categoryId" = c.id
      WHERE ${countConditions.join(' AND ')}
    `;
    const countResult = await client.query(countQuery, countParams.length > 0 ? countParams : undefined);
    const total = countResult.rows[0]?.total || 0;
    
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
    
  } finally {
    if (client) {
      client.release();
    }
  }
}

function addSecurityHeaders(response: NextResponse, remaining: number, resetAt: number): void {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}
