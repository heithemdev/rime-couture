/**
 * Product Detail Page
 * Displays full product information with image gallery, variants, and reviews
 */

import { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import ProductPageClient from './ProductPageClient';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { validateSession } from '@/lib/auth/session';

interface PageProps {
  params: Promise<{ productId: string }>;
}

// Fetch product data
async function getProduct(productId: string, locale: string) {
  // Always use internal URL for server-side fetches to avoid ngrok/proxy loops
  const baseUrl = typeof window === 'undefined'
    ? (process.env.INTERNAL_APP_URL || 'http://localhost:3000')
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  
  try {
    const res = await fetch(`${baseUrl}/api/products/${productId}?locale=${locale}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const locale = await getLocale();
  const product = await getProduct(productId, locale);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.media?.filter((m: { kind: string }) => m.kind === 'IMAGE').map((m: { url: string }) => m.url),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
  const locale = await getLocale();
  const product = await getProduct(productId, locale);

  // Check if user is admin
  const session = await validateSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!product) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-md)' }}>
            Product Not Found
          </h1>
          <p style={{ color: 'var(--color-on-surface-secondary)' }}>
            The product you are looking for does not exist or has been removed.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ProductPageClient product={product} locale={locale} isAdmin={isAdmin} />
      <Footer />
    </>
  );
}
