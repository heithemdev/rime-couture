'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import ProductCard from '@/components/shared/ProductCard';
import ProductCarousel from '@/components/shared/ProductCarousel';

// Product type matching the API response
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
  salesCount?: number;
  inStock: boolean;
  isFeatured?: boolean;
  colors: { code: string; hex: string | null; label: string }[];
  category: string;
}

export default function BestSellers() {
  const t = useTranslations('bestSellers');
  const tc = useTranslations('common');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Simple in-memory cache key for products
  const cacheKey = `bestsellers-${locale}`;

  // Fetch products from the database - with proper caching
  useEffect(() => {
    if (!isVisible || hasLoaded) return;

    const fetchProducts = async () => {
      try {
        // Check sessionStorage cache first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setProducts(data);
            setHasLoaded(true);
            return;
          }
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/products?locale=${locale.toUpperCase()}&featured=true&limit=8&sortBy=bestselling`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch products');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'API returned error');
        }
        
        if (!data.products || data.products.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }
        
        // Map API response to component format with badges
        const mappedProducts = data.products.map((product: ProductData) => {
          let badge: string | undefined;
          let badgeType: 'sale' | 'new' | 'bestseller' | undefined;
          
          // Determine badge based on product properties
          if (product.originalPrice && product.originalPrice > product.price) {
            badge = tc('sale');
            badgeType = 'sale';
          } else if (product.isFeatured) {
            badge = tc('bestSeller');
            badgeType = 'bestseller';
          } else if ((product.salesCount ?? 0) >= 50) {
            badge = tc('bestSeller');
            badgeType = 'bestseller';
          }
          
          return {
            ...product,
            badge,
            badgeType,
          };
        });
        
        // Save to sessionStorage cache
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: mappedProducts,
            timestamp: Date.now()
          }));
        } catch {
          // Ignore storage errors (quota exceeded, etc.)
        }

        setProducts(mappedProducts);
        setHasLoaded(true);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [locale, tc, isVisible, hasLoaded, cacheKey]);

  // Convert minor units to major units for display
  const formatPrice = (priceMinor: number) => priceMinor / 100;

  // Lazy load: trigger fetch when section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Trigger fetch when section is visible
            if (!isVisible) {
              setIsVisible(true);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' } // Start loading before visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const handleAddToCart = (id: string) => {
    console.log('Add to cart:', id);
    // TODO: Implement cart functionality
  };

  const handleAddToWishlist = (id: string) => {
    console.log('Add to wishlist:', id);
    // TODO: Implement wishlist functionality
  };

  const handleQuickView = (id: string) => {
    console.log('Quick view:', id);
    // TODO: Implement quick view modal
  };

  const handleShowAll = () => {
    // Navigate to products page or open modal with all products
    window.location.href = `/${locale}/products?featured=true`;
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
        @media (max-width: 767px) {
          .bestsellers-product-wrapper {
            flex: 0 0 280px;
          }
          .bestsellers-header {
            padding: 0;
          }
        }
      `}</style>

      <section className="bestsellers-section" ref={sectionRef}>
        <div className="bestsellers-container">
          <div className="bestsellers-header">
            <h2 className="bestsellers-title">{t('title')}</h2>
          </div>
          
          {loading ? (
            <div className="bestsellers-loading">
              <div className="bestsellers-loading-spinner" />
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
                onClick={() => window.location.reload()}
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
              showAllButton={true}
              showAllText={t('showAll') || 'Show All'}
              onShowAll={handleShowAll}
              maxVisibleItems={4}
            >
              {products.map((product) => (
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
                    inStock={product.inStock}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={handleAddToWishlist}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </ProductCarousel>
          )}
        </div>
      </section>
    </>
  );
}
