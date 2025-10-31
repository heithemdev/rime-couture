/* eslint-env node */
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: { remotePatterns: [] },

  // local workspace package
  transpilePackages: ['@repo/db'],

  // Next 16: keep native deps external
  serverExternalPackages: ['@prisma/client', 'argon2', 'bcryptjs'],

  // Use Turbopack cleanly
  turbopack: {},

  async headers() {
    return isProd ? [{ source: '/(.*)', headers: securityHeaders }] : []
  }
}

export default nextConfig
