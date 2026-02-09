// apps/web/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ==============================================================================
 * PROXY - Next.js 16 Request Handler
 * ==============================================================================
 * Handles:
 * 1. Admin route protection (cookie-presence check → redirect to /admin/login)
 * 2. Security headers for all requests
 *
 * NOTE: We don't use next-intl middleware here because we use cookie-based
 * locale detection (localePrefix: "never"), not URL-based routing.
 * The locale is resolved in i18n/request.ts via getRequestConfig.
 */

// Environment detection (cached at module load)
const IS_PROD = process.env.NODE_ENV === 'production';

// Admin auth constants
const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_LOGIN_PATH = '/admin/login';

// Pre-compiled localhost regex
const LOCALHOST_REGEX = /^(localhost|127\.0\.0\.1)(:\d+)?$|\.local$/i;

function isLocalhost(host: string | null): boolean {
  return host ? LOCALHOST_REGEX.test(host) : false;
}

// Pre-built CSP strings (avoid rebuilding on every request)
const CSP_BASE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: ws: http://localhost:*",
  "frame-src 'self' https:",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
];

// Production CSP adds upgrade-insecure-requests; dev omits it for localhost
const CSP_PROD = [...CSP_BASE, 'upgrade-insecure-requests'].join('; ');
const CSP_DEV = CSP_BASE.join('; ');

// Permissions Policy
const PERMISSIONS_POLICY = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=(self)',
  'usb=()',
  'bluetooth=()',
].join(', ');

/**
 * Next.js 16 Proxy Handler
 */
export default function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // ── Admin route protection ─────────────────────────────────────────────
  // Fast cookie-presence check. Full DB validation happens in admin layout.
  if (pathname.startsWith('/admin') && pathname !== ADMIN_LOGIN_PATH) {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!adminToken) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin API routes (return 401 JSON, not redirect)
  if (pathname.startsWith('/api/admin')) {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 },
      );
    }
  }

  // ── Security headers ──────────────────────────────────────────────────
  // Continue to the actual page/API route
  const response = NextResponse.next({
    request: {
      headers: new Headers([
        ...Array.from(req.headers.entries()),
        ['x-pathname', pathname],
      ]),
    },
  });

  const host = req.headers.get('host');
  const isLocal = isLocalhost(host);

  // Standard Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', PERMISSIONS_POLICY);
  response.headers.set('Content-Security-Policy', IS_PROD && !isLocal ? CSP_PROD : CSP_DEV);

  // HSTS (Production only, NOT localhost)
  if (IS_PROD && !isLocal) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  return response;
}

/**
 * Route matcher configuration
 */
export const config = {
  matcher: [
    // Match all paths EXCEPT:
    // - _next internal files
    // - static files (favicon, images, etc.)
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\..*).*)',
  ],
};
