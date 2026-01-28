/**
 * Smart Search API Route
 * Fault-tolerant fuzzy search across products using raw SQL
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// ============================================================================
// DATABASE CONNECTION
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
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    // Supabase requires SSL but uses certificates that may not be in the default chain
    // rejectUnauthorized: false is safe here as we're connecting to a known Supabase instance
    ssl: {
      rejectUnauthorized: false,
    },
  });
  
  pool.on('error', (err) => {
    console.error('[search] Pool error:', err.message);
    pool = null;
  });
  
  return pool;
}

// ============================================================================
// FUZZY MATCHING UTILITIES
// ============================================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }
  
  return matrix[b.length]![a.length]!;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(query: string, text: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  
  if (normalizedText.includes(normalizedQuery)) {
    return 1;
  }
  
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
  const textWords = normalizedText.split(' ').filter(w => w.length > 0);
  
  let matchedWords = 0;
  let fuzzyMatchedWords = 0;
  
  for (const qWord of queryWords) {
    if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      matchedWords++;
      continue;
    }
    
    const maxDistance = qWord.length <= 4 ? 1 : 2;
    const fuzzyMatch = textWords.some(tWord => {
      const distance = levenshteinDistance(qWord, tWord);
      return distance <= maxDistance;
    });
    
    if (fuzzyMatch) {
      fuzzyMatchedWords++;
    }
  }
  
  const exactScore = matchedWords / queryWords.length;
  const fuzzyScore = fuzzyMatchedWords / queryWords.length * 0.7;
  
  return Math.min(1, exactScore + fuzzyScore);
}

// ============================================================================
// TYPES
// ============================================================================

interface RawProduct {
  id: string;
  slug: string;
  base_price_minor: number;
  avg_rating: number;
  review_count: number;
  sales_count: number;
  is_featured: boolean;
  name: string;
  description: string;
  category_name: string;
  image_url: string | null;
  total_stock: number;
  colors: string | null;
}

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  colors: string[];
  category: string;
  relevanceScore: number;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const pool = getPool();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const locale = (searchParams.get('locale') || 'EN').toUpperCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const minScore = parseFloat(searchParams.get('minScore') || '0.3');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        query: query,
        total: 0,
        message: 'Query too short',
      });
    }
    
    // Fetch all active products with translations
    const productsQuery = `
      SELECT 
        p.id,
        p.slug,
        p.base_price_minor,
        p.avg_rating,
        p.review_count,
        p.sales_count,
        p.is_featured,
        COALESCE(pt.name, pt_en.name, p.slug) as name,
        COALESCE(pt.description, pt_en.description, '') as description,
        COALESCE(ct.name, ct_en.name, c.slug) as category_name,
        (
          SELECT ma.url 
          FROM product_media pm 
          JOIN media_asset ma ON pm.media_id = ma.id 
          WHERE pm.product_id = p.id 
          ORDER BY pm.is_thumb DESC, pm.position ASC 
          LIMIT 1
        ) as image_url,
        COALESCE(SUM(pv.stock), 0)::int as total_stock,
        (
          SELECT STRING_AGG(DISTINCT COALESCE(colt.label, col.code), ', ')
          FROM product_variant pv2
          JOIN color col ON pv2.color_id = col.id
          LEFT JOIN color_translation colt ON col.id = colt.color_id AND colt.locale = $1
          WHERE pv2.product_id = p.id AND pv2.is_active = true
        ) as colors
      FROM product p
      JOIN category c ON p.category_id = c.id
      LEFT JOIN product_translation pt ON p.id = pt.product_id AND pt.locale = $1
      LEFT JOIN product_translation pt_en ON p.id = pt_en.product_id AND pt_en.locale = 'EN'
      LEFT JOIN category_translation ct ON c.id = ct.category_id AND ct.locale = $1
      LEFT JOIN category_translation ct_en ON c.id = ct_en.category_id AND ct_en.locale = 'EN'
      LEFT JOIN product_variant pv ON p.id = pv.product_id AND pv.is_active = true
      WHERE p.status = 'PUBLISHED' 
        AND p.is_active = true 
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.slug, p.base_price_minor, p.avg_rating, p.review_count, 
               p.sales_count, p.is_featured, pt.name, pt_en.name, pt.description, 
               pt_en.description, ct.name, ct_en.name, c.slug
    `;
    
    const productsResult = await pool.query<RawProduct>(productsQuery, [locale]);
    const products = productsResult.rows;
    
    // Score products based on query
    const scoredProducts: { product: RawProduct; score: number }[] = [];
    
    for (const product of products) {
      let totalScore = 0;
      
      // Name matching (highest weight)
      const nameScore = calculateSimilarity(query, product.name);
      totalScore += nameScore * 10;
      
      // Description matching
      const descScore = calculateSimilarity(query, product.description);
      totalScore += descScore * 5;
      
      // Category matching
      const categoryScore = calculateSimilarity(query, product.category_name);
      totalScore += categoryScore * 3;
      
      // Color matching
      if (product.colors) {
        const colorScore = calculateSimilarity(query, product.colors);
        if (colorScore > 0.5) {
          totalScore += colorScore * 4;
        }
      }
      
      // Boost for featured products
      if (product.is_featured) {
        totalScore *= 1.1;
      }
      
      // Boost for popular products
      if (product.sales_count > 50) {
        totalScore *= 1.05;
      }
      
      // Boost for highly rated products
      if (product.avg_rating >= 4.5) {
        totalScore *= 1.05;
      }
      
      if (totalScore >= minScore) {
        scoredProducts.push({ product, score: totalScore });
      }
    }
    
    // Sort by score and limit
    scoredProducts.sort((a, b) => b.score - a.score);
    const topProducts = scoredProducts.slice(0, limit);
    
    // Format results
    const results: SearchResult[] = topProducts.map(({ product, score }) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.base_price_minor,
      imageUrl: product.image_url || '',
      rating: product.avg_rating,
      reviewCount: product.review_count,
      inStock: product.total_stock > 0,
      colors: product.colors ? product.colors.split(', ') : [],
      category: product.category_name,
      relevanceScore: score,
    }));
    
    return NextResponse.json({
      success: true,
      results,
      query: query,
      total: results.length,
      locale,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
