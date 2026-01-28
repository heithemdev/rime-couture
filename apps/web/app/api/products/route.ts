/**
 * Products API Route
 * Fetch products from database for landing page and other components
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// ============================================================================
// DATABASE CONNECTION (singleton pattern for serverless)
// ============================================================================

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  pool = new Pool({
    connectionString,
    max: 10, // Increased from 2 for better concurrent request handling
    idleTimeoutMillis: 30000, // Increased to keep connections alive longer
    connectionTimeoutMillis: 5000, // Reduced for faster failures
    // Supabase requires SSL but uses certificates that may not be in the default chain
    // rejectUnauthorized: false is safe here as we're connecting to a known Supabase instance
    ssl: {
      rejectUnauthorized: false,
    },
    // Enable statement timeout for long-running queries
    statement_timeout: 10000, // 10 seconds max per query
  });
  
  pool.on('error', (err) => {
    console.error('[products] Pool error:', err.message);
    pool = null;
  });
  
  return pool;
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
  let client;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = (searchParams.get('locale') || 'EN').toUpperCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const featured = searchParams.get('featured') === 'true';
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'featured';
    
    const db = getPool();
    client = await db.connect();
    
    // Build WHERE conditions
    const conditions: string[] = [
      `p.status = 'PUBLISHED'`,
      `p."isActive" = true`,
      `p."deletedAt" IS NULL`
    ];
    const params: (string | number)[] = [];
    let paramIndex = 1;
    
    if (featured) {
      conditions.push(`p."isFeatured" = true`);
    }
    
    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    
    // Build ORDER BY
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
    
    // Main query to get products - optimized with index hints
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
    
    params.push(limit, offset);
    
    // Use a single query execution for better performance
    const productsResult = await client.query(productsQuery, params);
    const products = productsResult.rows;
    
    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: 0,
        limit,
        offset,
        locale,
      });
    }
    
    const productIds = products.map((p: { id: string }) => p.id);
    const categorySlugs = [...new Set(products.map((p: { categorySlug: string }) => p.categorySlug))];
    
    // Fetch product translations
    const translationsResult = await client.query(`
      SELECT "productId", locale, name, description
      FROM "ProductTranslation"
      WHERE "productId" = ANY($1)
    `, [productIds]);
    
    // Fetch category translations
    const categoryTransResult = await client.query(`
      SELECT c.slug as "categorySlug", ct.locale, ct.name
      FROM "Category" c
      JOIN "CategoryTranslation" ct ON c.id = ct."categoryId"
      WHERE c.slug = ANY($1)
    `, [categorySlugs]);
    
    // Fetch media
    const mediaResult = await client.query(`
      SELECT pm."productId", ma.url, pm."isThumb"
      FROM "ProductMedia" pm
      JOIN "MediaAsset" ma ON pm."mediaId" = ma.id
      WHERE pm."productId" = ANY($1)
      ORDER BY pm.position ASC
    `, [productIds]);
    
    // Fetch variants with colors and sizes
    const variantsResult = await client.query(`
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
    `, [productIds, locale]);
    
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
      // Get translation
      const translations = translationsMap.get(product.id) || [];
      const translation = translations.find(t => t.locale === locale)
        || translations.find(t => t.locale === 'EN')
        || translations[0];
      
      // Get category translation
      const catTranslations = categoryTransMap.get(product.categorySlug) || [];
      const catTranslation = catTranslations.find(t => t.locale === locale)
        || catTranslations.find(t => t.locale === 'EN')
        || catTranslations[0];
      
      // Get media
      const mediaList = mediaMap.get(product.id) || [];
      const thumbMedia = mediaList.find(m => m.isThumb) || mediaList[0];
      
      // Get variants
      const variants = variantsMap.get(product.id) || [];
      
      // Get unique colors
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
      
      // Get unique sizes
      const sizesMap = new Map<string, { code: string; label: string }>();
      for (const v of variants) {
        if (v.sizeCode && !sizesMap.has(v.sizeCode)) {
          sizesMap.set(v.sizeCode, {
            code: v.sizeCode,
            label: v.sizeLabel || v.sizeCode,
          });
        }
      }
      
      // Calculate total stock
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
    const countConditions = conditions.slice(); // Copy without limit/offset params
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
      offset,
      locale,
    });
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
