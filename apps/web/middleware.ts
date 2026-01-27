// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { applyProxy } from './proxy'; 

// 1. Initialize i18n routing
const handleI18n = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // 2. Step 1: Let next-intl handle the routing (redirects, rewrites, locale cookie)
  // This creates the initial response object.
  const response = handleI18n(req);

  // 3. Step 2: Pass that response to your Proxy logic to harden it
  // This modifies the response headers in place.
  return applyProxy(response, req);
}

// 4. Config Matcher
export const config = {
  // Match all paths EXCEPT:
  // - api routes (handled by secure-api.ts)
  // - _next internal files
  // - static files (favicon, manifest, images)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|.*\\..*).*)']
};