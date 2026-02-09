/**
 * RIME COUTURE — Favorites Page
 * ==============================
 * Displays products the signed-in user has liked.
 * Uses the same ProductGrid as the shopping page.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { ProductGrid, type Product } from '@/components/shopping';
import { useFingerprint } from '@/lib/cart-context';

const PER_PAGE = 12;

interface APIFavProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  likeCount: number;
  salesCount: number;
  inStock: boolean;
  isTopSeller?: boolean;
  category: string;
  categorySlug: string;
  colors: Array<{ id: string; code: string; hex: string | null; label: string }>;
  sizes: Array<{ id: string; code: string; label: string }>;
  variants: Array<{
    id: string;
    variantKey: string;
    sku: string;
    price: number | null;
    stock: number;
    sizeId: string | null;
    colorId: string | null;
  }>;
}

function toProduct(p: APIFavProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.originalPrice || null,
    discountPercent: p.discountPercent || null,
    description: p.description || null,
    images: p.imageUrl
      ? [{ id: `${p.id}-primary`, url: p.imageUrl, alt: p.name, isPrimary: true }]
      : [],
    category: { slug: p.categorySlug, name: p.category },
    badges: [],
    rating: p.rating,
    reviewCount: p.reviewCount,
    likeCount: p.likeCount,
    inStock: p.inStock,
    isTopSeller: p.isTopSeller ?? false,
    sizes: p.sizes,
    colors: p.colors,
    variants: p.variants,
  };
}

export default function FavoritesPage() {
  const locale = useLocale();
  const fingerprint = useFingerprint();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const fetchedRef = useRef(false);

  // Fetch favorites
  const fetchFavorites = useCallback(async (pg: number, append = false) => {
    if (!fingerprint) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/favorites?fingerprint=${fingerprint}&locale=${locale.toUpperCase()}&page=${pg}&limit=${PER_PAGE}`
      );
      const data = await res.json();
      if (data.success) {
        const mapped = (data.products || []).map(toProduct);
        setProducts(prev => append ? [...prev, ...mapped] : mapped);
        setHasMore(data.hasMore);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint, locale]);

  useEffect(() => {
    if (fingerprint && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchFavorites(1);
    }
  }, [fingerprint, fetchFavorites]);

  const handleLoadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchFavorites(next, true);
  }, [page, fetchFavorites]);

  return (
    <>
      <style jsx>{`
        .favorites-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #FFF8FA 0%, #fff 100%);
        }
        .favorites-content {
          flex: 1;
        }
        .favorites-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 20px;
        }
        .favorites-header {
          margin-bottom: 24px;
        }
        .favorites-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 16px 0 8px;
        }
        @media (max-width: 768px) {
          .favorites-container {
            padding: 16px;
          }
          .favorites-title {
            font-size: 24px;
          }
        }
      `}</style>
      <div className="favorites-page">
        <Header />
        <main className="favorites-content">
          <div className="favorites-container">
            <div className="favorites-header">
              <h1 className="favorites-title">Your Favorites</h1>
            </div>
            <ProductGrid
              products={products}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
