'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState, useCallback } from 'react';
import ProductCard from '@/components/shared/ProductCard';
import ProductCarousel from '@/components/shared/ProductCarousel';
import ProductSkeleton from '@/components/shared/ProductSkeleton';
import { getCache, setCache } from '@/lib/cache';

// Product type matching the API response
interface Size {
  id: string;
  code: string;
  label: string;
}

interface Color {
  id: string;
  code: string;
  hex?: string | null;
  label: string;
}

interface Variant {
  id: string;
  variantKey: string;
  sku: string;
  price: number | null;
  stock: number;
  sizeId: string | null;
  colorId: string | null;
}

interface ProductData {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  badge?: string;
  badgeType?: 'sale' | 'new' | 'bestseller';
  rating: number;
  reviewCount: number;
  likeCount?: number;
  salesCount?: number;
  inStock: boolean;
  isFeatured?: boolean;
  colors: Color[];
  sizes: Size[];
  variants: Variant[];
  category: string;
}

const BESTSELLERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function BestSellers() {
  const t = useTranslations('bestSellers');
  const tc = useTranslations('common');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasFetched = useRef(false);

  // Fetch products with optimized caching
  const fetchProducts = useCallback(async () => {
    // Prevent duplicate fetches
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cacheKey = `bestsellers-${locale}`;
    
    try {
      // Check cache first (instant)
      const cached = getCache<ProductData[]>(cacheKey);
      if (cached) {
        setProducts(cached);
        return;
      }

      setLoading(true);
      setError(null);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `/api/products?locale=${locale.toUpperCase()}&featured=true&limit=8&sortBy=bestselling`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.products?.length) {
        setProducts([]);
        return;
      }
      
      // Map API response with badges
      const mappedProducts = data.products.map((product: ProductData) => {
        let badge: string | undefined;
        let badgeType: 'sale' | 'new' | 'bestseller' | undefined;
        
        if (product.originalPrice && product.originalPrice > product.price) {
          badge = tc('sale');
          badgeType = 'sale';
        } else if (product.isFeatured || (product.salesCount ?? 0) >= 50) {
          badge = tc('bestSeller');
          badgeType = 'bestseller';
        }
        
        return { ...product, badge, badgeType };
      });
      
      // Cache the result
      setCache(cacheKey, mappedProducts, BESTSELLERS_CACHE_TTL);

      setProducts(mappedProducts);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      }
      hasFetched.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, [locale, tc]);

  // Convert minor units to major units for display
  const formatPrice = (priceMinor: number) => priceMinor / 100;

  // Lazy load: trigger fetch when section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            if (!isVisible) {
              setIsVisible(true);
              fetchProducts(); // Trigger fetch immediately
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '200px' } // Start loading 200px before visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible, fetchProducts]);

  const handleAddToWishlist = (id: string) => {
    console.log('Add to wishlist:', id);
    // TODO: Implement wishlist functionality
  };

  const handleQuickView = (id: string) => {
    console.log('Quick view:', id);
    // TODO: Implement quick view modal
  };

  // Retry handler
  const handleRetry = () => {
    hasFetched.current = false;
    setError(null);
    fetchProducts();
  };

  return (
    <>
      <style jsx>{`
        .bestsellers-section {
          padding: var(--spacing-4xl) 0;
          overflow: hidden;
          background-color: color-mix(in oklab, var(--color-secondary) 5%, var(--color-surface));
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bestsellers-section.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .bestsellers-container {
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          max-width: 100%;
        }
        .bestsellers-header {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-3xl);
          justify-content: center;
          max-width: var(--content-max-width);
          margin-left: auto;
          margin-right: auto;
          padding: 0 var(--spacing-xl);
        }
        .bestsellers-title {
          font-size: var(--font-size-3xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
        }
        .bestsellers-product-wrapper {
          flex: 0 0 300px;
          scroll-snap-align: start;
        }
        .bestsellers-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-xl);
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
        }
        .bestsellers-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          color: var(--color-text-muted);
        }
        .bestsellers-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .bestsellers-error {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          color: var(--color-error, #dc2626);
          text-align: center;
          padding: var(--spacing-xl);
          gap: 16px;
        }
        .bestsellers-error-icon {
          width: 48px;
          height: 48px;
          opacity: 0.5;
        }
        .bestsellers-error-message {
          font-size: 14px;
          max-width: 300px;
        }
        .bestsellers-retry-btn {
          padding: 10px 20px;
          background: var(--color-primary, #FF6B9D);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .bestsellers-retry-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .bestsellers-empty {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          color: var(--color-text-muted);
          text-align: center;
          gap: 12px;
        }
        .bestsellers-empty-icon {
          width: 64px;
          height: 64px;
          opacity: 0.3;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1199px) {
          .bestsellers-skeleton-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 991px) {
          .bestsellers-skeleton-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 767px) {
          .bestsellers-product-wrapper {
            flex: 0 0 280px;
          }
          .bestsellers-header {
            padding: 0;
          }
          .bestsellers-skeleton-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }
        }
        @media (max-width: 480px) {
          .bestsellers-skeleton-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <section className="bestsellers-section" ref={sectionRef}>
        <div className="bestsellers-container">
          <div className="bestsellers-header">
            <h2 className="bestsellers-title">{t('title')}</h2>
          </div>
          
          {loading ? (
            <div className="bestsellers-skeleton-grid">
              <ProductSkeleton count={4} />
            </div>
          ) : error ? (
            <div className="bestsellers-error">
              <svg className="bestsellers-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="bestsellers-error-message">{error}</p>
              <button 
                className="bestsellers-retry-btn"
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bestsellers-empty">
              <svg className="bestsellers-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p>{t('noProducts') || 'No products available yet'}</p>
            </div>
          ) : (
            <ProductCarousel 
              itemWidth={300} 
              gap={24}
              showArrows={true}
              showDots={true}
              seeAllUrl="/shopping"
              seeAllText={t('showAll')}
            >
              {products.map((product) => {
                // Transform variants to include full size/color objects
                const transformedVariants = (product.variants || []).map(v => ({
                  id: v.id,
                  variantKey: v.variantKey,
                  sku: v.sku,
                  price: v.price,
                  stock: v.stock,
                  size: v.sizeId ? product.sizes.find(s => s.id === v.sizeId) || null : null,
                  color: v.colorId ? product.colors.find(c => c.id === v.colorId) || null : null,
                }));
                
                return (
                  <div key={product.id} className="bestsellers-product-wrapper">
                    <ProductCard
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={formatPrice(product.price)}
                      originalPrice={product.originalPrice ? formatPrice(product.originalPrice) : undefined}
                      currency="DZD"
                      imageUrl={product.imageUrl}
                      badge={product.badge}
                      badgeType={product.badgeType}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      likeCount={product.likeCount || 0}
                      inStock={product.inStock}
                      sizes={product.sizes || []}
                      colors={product.colors || []}
                      variants={transformedVariants}
                      onAddToWishlist={handleAddToWishlist}
                      onQuickView={handleQuickView}
                    />
                  </div>
                );
              })}
            </ProductCarousel>
          )}
        </div>
      </section>
    </>
  );
}
