// apps/web/proxy.ts
import { NextResponse, type NextRequest } from "next/server";

/**
 * ==============================================================================
 * PROXY CONFIGURATION & SECURITY LAYER
 * ==============================================================================
 * Single source of truth for ALL security headers.
 * Called by middleware.ts after i18n routing is resolved.
 * 
 * DO NOT add security headers in next.config.js - it causes double headers!
 */

// 1. Fast Environment Detection (cached at module load)
const IS_PROD = process.env.NODE_ENV === "production";

// 2. Pre-compiled Regex for Localhost (Performance optimization)
const LOCALHOST_REGEX = /^(localhost|127\.0\.0\.1)(:\d+)?$|\.local$/i;

function isLocalhost(host: string | null): boolean {
  return host ? LOCALHOST_REGEX.test(host) : false;
}

// 3. Pre-built CSP string (avoid rebuilding on every request)
const CSP_DIRECTIVES = [
  // Fallback for any resource type not explicitly listed
  "default-src 'self'",
  
  // Scripts: self + inline (Next.js hydration) + eval (dev tools/source maps)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  
  // Styles: self + inline (Tailwind JIT, CSS-in-JS) + Google Fonts CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  
  // Images: self + data URIs + blobs + HTTPS (Cloudinary, external images)
  "img-src 'self' data: blob: https:",
  
  // Fonts: self + data URIs + Google Fonts files
  "font-src 'self' data: https://fonts.gstatic.com",
  
  // API/fetch: self + HTTPS + WebSockets (HMR, real-time features)
  "connect-src 'self' https: wss: ws:",
  
  // Iframes: self + HTTPS (payment embeds, maps, videos)
  "frame-src 'self' https:",
  
  // Media (video/audio): self + HTTPS
  "media-src 'self' https:",
  
  // Workers: self + blobs (for PDF generation, etc.)
  "worker-src 'self' blob:",
  
  // Disallow plugins (Flash, Java applets - obsolete but good practice)
  "object-src 'none'",
  
  // Restrict <base> tag to prevent base URL hijacking
  "base-uri 'self'",
  
  // Restrict form submission targets
  "form-action 'self'",
  
  // Block page from being framed (supplement to X-Frame-Options)
  "frame-ancestors 'self'",
  
  // Upgrade HTTP requests to HTTPS (belt + suspenders with HSTS)
  "upgrade-insecure-requests",
].join("; ");

// 4. Permissions Policy (disable unused powerful features)
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=(self)", // Enable for Chargily payment gateway
  "usb=()",
  "bluetooth=()",
].join(", ");

/**
 * Applies security headers to an existing response.
 * @param res - The NextResponse object (from next-intl)
 * @param req - The incoming NextRequest
 */
export function applyProxy(res: NextResponse, req: NextRequest): NextResponse {
  const host = req.headers.get("host");
  const isLocal = isLocalhost(host);

  // --- A. Standard Security Headers ---
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set("Permissions-Policy", PERMISSIONS_POLICY);

  // --- B. Content Security Policy ---
  res.headers.set("Content-Security-Policy", CSP_DIRECTIVES);

  // --- C. HSTS (Production only, NOT localhost) ---
  // CRITICAL: Enabling HSTS on localhost breaks dev for up to 2 years!
  if (IS_PROD && !isLocal) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload" // 2 years
    );
  }

  // --- D. Cross-Origin Isolation (optional, for SharedArrayBuffer) ---
  // Uncomment if you need high-resolution timers or SharedArrayBuffer
  // res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

  return res;
}