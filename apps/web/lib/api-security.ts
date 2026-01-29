/**
 * API Security Utilities
 * Rate limiting, bot protection, input validation, and SQL injection prevention
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// RATE LIMITING (In-memory for Edge/Serverless)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory store (resets on cold start - good enough for serverless)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;   // Prefix for rate limit key
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60000,      // 1 minute
  maxRequests: 60,      // 60 requests per minute
  keyPrefix: 'api',
};

export function getRateLimitKey(request: NextRequest, prefix: string = 'api'): string {
  // Get client IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${prefix}:${ip}`;
}

export function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimitStore();
  
  const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_RATE_LIMIT, ...config };
  const key = getRateLimitKey(request, keyPrefix);
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Create new entry
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }
  
  entry.count++;
  
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please slow down.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
      },
    }
  );
}

// ============================================================================
// BOT DETECTION
// ============================================================================

const SUSPICIOUS_USER_AGENTS = [
  /bot/i,
  /spider/i,
  /crawl/i,
  /scrape/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /go-http-client/i,
  /java/i,
  /phantom/i,
  /headless/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

// Known good bots (search engines)
const ALLOWED_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i, // Yahoo
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
];

export interface BotCheckResult {
  isBot: boolean;
  isSuspicious: boolean;
  isAllowedBot: boolean;
  reason?: string;
}

export function checkForBot(request: NextRequest): BotCheckResult {
  const userAgent = request.headers.get('user-agent') || '';
  
  // No user agent is suspicious
  if (!userAgent || userAgent.length < 10) {
    return { isBot: true, isSuspicious: true, isAllowedBot: false, reason: 'Missing or short user agent' };
  }
  
  // Check for allowed bots first
  for (const pattern of ALLOWED_BOTS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, isSuspicious: false, isAllowedBot: true };
    }
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, isSuspicious: true, isAllowedBot: false, reason: 'Suspicious user agent pattern' };
    }
  }
  
  // Additional heuristics
  const acceptLanguage = request.headers.get('accept-language');
  const accept = request.headers.get('accept');
  
  // Real browsers typically send these headers
  if (!acceptLanguage && !accept) {
    return { isBot: true, isSuspicious: true, isAllowedBot: false, reason: 'Missing browser headers' };
  }
  
  return { isBot: false, isSuspicious: false, isAllowedBot: false };
}

// ============================================================================
// INPUT VALIDATION & SQL INJECTION PREVENTION
// ============================================================================

// Dangerous SQL patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
  /(--)/, // SQL comments
  /(;).*(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i, // Chained statements
  /('.*OR.*'.*=.*')/i, // Classic OR injection
  /(1\s*=\s*1)/i, // Tautology
  /(\bOR\b\s+\d+\s*=\s*\d+)/i, // OR 1=1 variations
  /(\/\*.*\*\/)/i, // Block comments
  /(\bCHAR\s*\()/i, // CHAR() function
  /(\bCONCAT\s*\()/i, // CONCAT() function
  /(0x[0-9a-fA-F]+)/i, // Hex values
];

export function containsSqlInjection(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  
  return false;
}

export function sanitizeInput(value: string, maxLength: number = 100): string {
  if (typeof value !== 'string') return '';
  
  // Trim and limit length
  let sanitized = value.trim().slice(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

// Validate and sanitize common parameter types
export function validateLocale(locale: string | null): string {
  const allowed = ['EN', 'FR', 'AR'];
  const upper = (locale || 'EN').toUpperCase();
  return allowed.includes(upper) ? upper : 'EN';
}

export function validatePositiveInt(
  value: string | null, 
  defaultValue: number, 
  max: number = 1000
): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) return defaultValue;
  return Math.min(num, max);
}

export function validateSlug(value: string | null): string | null {
  if (!value) return null;
  
  // Slugs should only contain lowercase letters, numbers, and hyphens
  const slug = value.toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (slug.length > 100) return null;
  if (containsSqlInjection(slug)) return null;
  
  return slug;
}

export function validateSortBy(value: string | null): string {
  const allowed = ['featured', 'newest', 'bestselling', 'price-asc', 'price-desc', 'rating'];
  return allowed.includes(value || '') ? value! : 'featured';
}

export function validatePriceRange(value: string | null): string | null {
  const allowed = ['under2000', '2000to5000', '5000to10000', 'over10000'];
  return allowed.includes(value || '') ? value : null;
}

export function validateGender(value: string | null): string | null {
  const allowed = ['boy', 'girl'];
  return allowed.includes(value || '') ? value : null;
}

export function validateKitchenType(value: string | null): string | null {
  const allowed = ['items', 'mama'];
  return allowed.includes(value || '') ? value : null;
}

export function validateSearchQuery(value: string | null, maxLength: number = 100): string | null {
  if (!value || value.trim().length === 0) return null;
  
  // Trim and limit length
  const trimmed = value.trim().slice(0, maxLength);
  
  // Check for SQL injection patterns
  if (containsSqlInjection(trimmed)) {
    return null;
  }
  
  // Remove potentially dangerous characters but allow spaces and common chars
  const sanitized = trimmed
    .replace(/[<>{}[\]\\^`|]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();
  
  return sanitized.length >= 2 ? sanitized : null;
}

export function validateCodeList(value: string | null, maxItems: number = 20): string[] {
  if (!value) return [];
  
  const items = value.split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0 && s.length <= 50)
    .filter(s => /^[a-z0-9-_]+$/.test(s)) // Only alphanumeric, hyphens, underscores
    .filter(s => !containsSqlInjection(s))
    .slice(0, maxItems);
  
  return items;
}

// ============================================================================
// SECURITY MIDDLEWARE WRAPPER
// ============================================================================

export interface SecurityConfig {
  rateLimit?: Partial<RateLimitConfig>;
  blockSuspiciousBots?: boolean;
  allowedMethods?: string[];
}

const DEFAULT_SECURITY: SecurityConfig = {
  rateLimit: DEFAULT_RATE_LIMIT,
  blockSuspiciousBots: true,
  allowedMethods: ['GET'],
};

export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
): (request: NextRequest) => Promise<NextResponse> {
  const { rateLimit, blockSuspiciousBots, allowedMethods } = { ...DEFAULT_SECURITY, ...config };
  
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check allowed methods
    if (allowedMethods && !allowedMethods.includes(request.method)) {
      return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
      );
    }
    
    // Check rate limit
    if (rateLimit) {
      const { allowed, remaining, resetAt } = checkRateLimit(request, rateLimit);
      
      if (!allowed) {
        return rateLimitResponse(resetAt);
      }
      
      // Add rate limit headers to successful responses later
      const response = await processRequest();
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      return response;
    }
    
    return processRequest();
    
    async function processRequest(): Promise<NextResponse> {
      // Check for suspicious bots
      if (blockSuspiciousBots) {
        const botCheck = checkForBot(request);
        if (botCheck.isSuspicious) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }
      
      // Call the actual handler
      return handler(request);
    }
  };
}

// ============================================================================
// CORS HEADERS
// ============================================================================

export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  // Only allow same-origin or specific domains
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}
