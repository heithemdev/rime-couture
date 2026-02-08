import createNextIntlPlugin from "next-intl/plugin";

// Suppress noisy TLS/SSL warnings (needed for Supabase pooler's self-signed certs)
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (...args) {
  if (typeof args[0] === 'string' && (
    args[0].includes('NODE_TLS_REJECT_UNAUTHORIZED') ||
    args[0].includes('SECURITY WARNING: The SSL modes')
  )) return;
  return originalEmitWarning.apply(process, args);
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Enable styled-jsx optimization
  compiler: {
    styledJsx: true,
  },

  images: {
    remotePatterns: [
      // Cloudinary for product images
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Pexels for demo images
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },

  // Local workspace package
  transpilePackages: ["@repo/db"],

  // Keep native deps external
  serverExternalPackages: ["@prisma/client", "argon2", "bcryptjs"],

  // Turbopack
  turbopack: {},

  // Allow ngrok dev origins to prevent cross-origin warnings
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],

  // Security headers are handled by middleware.ts -> proxy.ts
  // This prevents "double headers" and allows better control (HSTS, localhost detection)
};

export default withNextIntl(nextConfig);
