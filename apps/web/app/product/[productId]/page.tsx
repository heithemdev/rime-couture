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
import { getProductById } from '@/lib/product-data';

interface PageProps {
  params: Promise<{ productId: string }>;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const locale = await getLocale();
  const product = await getProductById(productId, locale);

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

  let product;
  let dbError = false;

  try {
    product = await getProductById(productId, locale);
  } catch {
    // DB connection failed — don't show "Not Found", show a retry page
    dbError = true;
  }

  if (dbError) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <h1 style={{ fontSize: '1.5rem' }}>
            Temporary connection issue
          </h1>
          <p style={{ color: '#666', maxWidth: '400px' }}>
            We couldn&apos;t load this product right now. This usually resolves in a few seconds.
          </p>
          <a
            href={`/product/${productId}`}
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#2dafaa',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              marginTop: '0.5rem',
            }}
          >
            Try Again
          </a>
        </div>
        <Footer />
      </>
    );
  }

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

  // Check if user is admin (non-blocking)
  let isAdmin = false;
  try {
    const session = await validateSession();
    isAdmin = session?.user?.role === 'ADMIN';
  } catch {
    // Session check failed — continue as non-admin
  }

  return (
    <>
      <Header />
      <ProductPageClient product={product} locale={locale} isAdmin={isAdmin} />
      <Footer />
    </>
  );
}
