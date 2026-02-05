'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Package, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';
import ProductSkeleton from '@/components/shared/ProductSkeleton';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string | null;
  images: Array<{ id: string; url: string; alt?: string | null; isPrimary: boolean }>;
  category?: {
    slug: string;
    name: string;
  } | null;
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  inStock?: boolean;
  sizes?: Array<{ id: string; code: string; label: string }>;
  colors?: Array<{ id: string; code: string; hex?: string | null; label: string }>;
  variants?: Array<{
    id: string;
    variantKey: string;
    sku: string;
    price: number | null;
    stock: number;
    sizeId: string | null;
    colorId: string | null;
  }>;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

export default function ProductGrid({
  products,
  isLoading,
  hasMore,
  onLoadMore,
  className = '',
}: ProductGridProps) {
  const t = useTranslations('shopping');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      {
        rootMargin: '200px',
        threshold: 0,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Trigger load more when visible
  useEffect(() => {
    if (isVisible && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isVisible, hasMore, isLoading, onLoadMore]);

  const formatProductForCard = useCallback((product: Product) => {
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
    
    // Transform variants for ProductCard - map sizeId/colorId to nested objects
    const transformedVariants = product.variants?.map((v) => ({
      id: v.id,
      variantKey: v.variantKey,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      size: v.sizeId ? product.sizes?.find((s) => s.id === v.sizeId) || null : null,
      color: v.colorId ? product.colors?.find((c) => c.id === v.colorId) || null : null,
    })) || [];
    
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      imageUrl: primaryImage?.url || '/assets/placeholder.png',
      imageAlt: primaryImage?.alt || product.name,
      badges: product.badges || [],
      rating: product.rating,
      reviewCount: product.reviewCount,
      likeCount: product.likeCount,
      inStock: product.inStock ?? true,
      sizes: product.sizes || [],
      colors: product.colors || [],
      variants: transformedVariants,
    };
  }, []);

  return (
    <>
      <style jsx>{`
        .product-grid-container {
          width: 100%;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-xl);
        }
        .product-grid-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-3xl) var(--spacing-xl);
          text-align: center;
          background: linear-gradient(135deg, #FFF0F5 0%, var(--color-surface) 100%);
          border-radius: var(--border-radius-lg);
          border: 2px dashed var(--color-border);
        }
        .product-grid-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--border-radius-full);
          background: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
          color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(255, 77, 129, 0.15);
        }
        .product-grid-empty-title {
          font-size: var(--font-size-xl);
          font-weight: 600;
          font-family: var(--font-family-heading);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-sm);
        }
        .product-grid-empty-text {
          font-size: var(--font-size-base);
          color: var(--color-on-surface-secondary);
          max-width: 400px;
        }
        .product-grid-load-more {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: var(--spacing-xl) 0;
        }
        .product-grid-load-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          background: linear-gradient(135deg, var(--color-primary) 0%, #FF8FA3 100%);
          color: white;
          border: none;
          border-radius: var(--border-radius-control);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 77, 129, 0.3);
        }
        .product-grid-load-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 77, 129, 0.4);
        }
        .product-grid-load-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .product-grid-load-btn .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .product-grid-sentinel {
          height: 1px;
          width: 100%;
        }
        .product-grid-loading {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-xl);
        }
        @media (max-width: 1199px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .product-grid-loading {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 991px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-lg);
          }
          .product-grid-loading {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-lg);
          }
        }
        @media (max-width: 575px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }
          .product-grid-loading {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }
        }
        @media (max-width: 400px) {
          .product-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          .product-grid-loading {
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
        }
      `}</style>

      <div className={`product-grid-container ${className}`}>
        <div className="product-grid">
          {/* Product cards */}
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...formatProductForCard(product)}
            />
          ))}

          {/* Empty state */}
          {!isLoading && products.length === 0 && (
            <div className="product-grid-empty">
              <div className="product-grid-empty-icon">
                <Package size={36} />
              </div>
              <h3 className="product-grid-empty-title">{t('noProducts')}</h3>
              <p className="product-grid-empty-text">{t('noProductsDescription')}</p>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="product-grid-loading">
              <ProductSkeleton count={products.length === 0 ? 8 : 4} />
            </div>
          )}

          {/* Load more button / sentinel */}
          {hasMore && !isLoading && products.length > 0 && (
            <div className="product-grid-load-more">
              <button
                className="product-grid-load-btn"
                onClick={onLoadMore}
              >
                <RefreshCw size={18} />
                {t('loadMore')}
              </button>
            </div>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="product-grid-sentinel" />
      </div>
    </>
  );
}
