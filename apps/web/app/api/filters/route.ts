/**
 * Filters API Route
 * Returns available filter options (colors, sizes, materials, etc.) from database
 * With rate limiting and bot protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
import {
  checkRateLimit,
  rateLimitResponse,
  checkForBot,
  validateLocale,
} from '@/lib/api-security';

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
    ssl: {
      rejectUnauthorized: false,
    },
    query_timeout: 15000,
    statement_timeout: 15000,
  });
  
  pool.on('error', (err) => {
    console.error('[filters] Pool error:', err.message);
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
      return await db.connect();
    } catch (error) {
      lastError = error as Error;
      console.error(`[filters] Connection attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
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
// TYPES
// ============================================================================

interface FilterOption {
  code: string;
  label: string;
  hex?: string | null;
}

interface FilterData {
  sizes: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
  patterns: FilterOption[];
  seasons: FilterOption[];
  occasions: FilterOption[];
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  
  try {
    // ========== SECURITY CHECKS ==========
    
    // Rate limiting (100 requests per minute - filters are cached)
    const rateLimit = checkRateLimit(request, {
      windowMs: 60000,
      maxRequests: 100,
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
    
    // ========== VALIDATE INPUT ==========
    
    const searchParams = request.nextUrl.searchParams;
    const locale = validateLocale(searchParams.get('locale'));
    
    // ========== DATABASE QUERY ==========
    
    client = await getClient();
    
    // Fetch all filter options in parallel
    const [sizesResult, colorsResult, tagsResult] = await Promise.all([
      // Fetch sizes
      client.query(`
        SELECT 
          s.code,
          COALESCE(st.label, s.code) as label
        FROM "Size" s
        LEFT JOIN "SizeTranslation" st ON s.id = st."sizeId" AND st.locale = $1
        ORDER BY s."sortOrder", s.code
      `, [locale]),
      
      // Fetch colors
      client.query(`
        SELECT 
          c.code,
          c.hex,
          COALESCE(ct.label, c.code) as label
        FROM "Color" c
        LEFT JOIN "ColorTranslation" ct ON c.id = ct."colorId" AND ct.locale = $1
        ORDER BY c."sortOrder", c.code
      `, [locale]),
      
      // Fetch tags grouped by type
      client.query(`
        SELECT 
          t.slug as code,
          t.type,
          COALESCE(tt.label, t.slug) as label
        FROM "Tag" t
        LEFT JOIN "TagTranslation" tt ON t.id = tt."tagId" AND tt.locale = $1
        WHERE t."isActive" = true
        ORDER BY t.type, t."sortOrder", t.slug
      `, [locale]),
    ]);
    
    // Process tags by type
    const materials: FilterOption[] = [];
    const patterns: FilterOption[] = [];
    const seasons: FilterOption[] = [];
    const occasions: FilterOption[] = [];
    
    for (const tag of tagsResult.rows) {
      const option: FilterOption = {
        code: tag.code,
        label: tag.label,
      };
      
      switch (tag.type) {
        case 'MATERIAL':
          materials.push(option);
          break;
        case 'PATTERN':
          patterns.push(option);
          break;
        case 'MOOD_SEASON':
          seasons.push(option);
          break;
        case 'OCCASION':
          occasions.push(option);
          break;
      }
    }
    
    const filterData: FilterData = {
      sizes: sizesResult.rows.map(row => ({
        code: row.code,
        label: row.label,
      })),
      colors: colorsResult.rows.map(row => ({
        code: row.code,
        label: row.label,
        hex: row.hex,
      })),
      materials,
      patterns,
      seasons,
      occasions,
    };
    
    // Set cache headers and security headers
    const response = NextResponse.json(filterData);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;
    
  } catch (error) {
    console.error('[filters] Error:', error);
    
    // Return empty filter data on error
    const emptyFilters: FilterData = {
      sizes: [],
      colors: [],
      materials: [],
      patterns: [],
      seasons: [],
      occasions: [],
    };
    
    return NextResponse.json(emptyFilters, { status: 500 });
    
  } finally {
    if (client) {
      client.release();
    }
  }
}
