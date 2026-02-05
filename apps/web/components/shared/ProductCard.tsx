'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ShoppingCart, Heart, Eye, Star, Loader2 } from 'lucide-react';
import SafeLink from '@/components/shared/SafeLink';
import AddToCartModal from '@/components/product/AddToCartModal';
import ImageQuickViewModal from '@/components/shared/ImageQuickViewModal';
import { useCart, useFingerprint } from '@/lib/cart-context';
import { useLikes } from '@/lib/likes-context';

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
  size: Size | null;
  color: Color | null;
}

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  imageUrl: string;
  imageAlt?: string;
  badge?: string;
  badgeType?: 'sale' | 'new' | 'bestseller';
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  inStock?: boolean;
  // Variant data for cart modal
  sizes?: Size[];
  colors?: Color[];
  variants?: Variant[];
  onAddToCart?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickView?: (id: string) => void;
}

export default function ProductCard({
  id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  slug,
  name,
  price,
  originalPrice,
  currency = 'DZD',
  imageUrl,
  imageAlt,
  badge,
  badgeType = 'new',
  rating,
  reviewCount,
  likeCount: initialLikeCount = 0,
  inStock = true,
  sizes = [],
  colors = [],
  variants = [],
  onAddToCart,
  onAddToWishlist,
  onQuickView,
}: ProductCardProps) {
  const fingerprint = useFingerprint();
  const { addToCart } = useCart();
  const { getLikeData, registerProduct, toggleLike, isLiking: checkIsLiking } = useLikes();
  
  const [showCartModal, setShowCartModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Register product for batch like fetching
  useEffect(() => {
    if (fingerprint && id) {
      registerProduct(id);
    }
  }, [id, fingerprint, registerProduct]);

  // Get like data from context (or use initial values)
  const likeData = getLikeData(id);
  const isLiked = likeData?.isLiked ?? false;
  const likeCount = likeData?.likeCount ?? initialLikeCount;
  const isLiking = checkIsLiking(id);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handle add to cart - show modal if variants exist
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    // If product has variants, show modal
    if (variants.length > 0 && (sizes.length > 0 || colors.length > 0)) {
      setShowCartModal(true);
    } else {
      // No variants, direct add (shouldn't happen usually)
      onAddToCart?.(id);
    }
  }, [id, inStock, variants.length, sizes.length, colors.length, onAddToCart]);

  // Handle cart modal add
  const handleCartModalAdd = useCallback(async (variantId: string, quantity: number) => {
    await addToCart(id, variantId, quantity);
  }, [id, addToCart]);

  // Handle like toggle - uses global context
  const handleLikeToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fingerprint || isLiking) return;

    await toggleLike(id);
    onAddToWishlist?.(id);
  }, [id, fingerprint, isLiking, toggleLike, onAddToWishlist]);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
    onQuickView?.(id);
  };

  const discountPercent = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  return (
    <>
      <style jsx>{`
        .product-card {
          width: 100%;
          display: flex;
          position: relative;
          background: var(--color-surface);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: var(--border-radius-lg);
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--color-border);
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }
        .product-card-link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          height: 100%;
        }
        .product-image-container {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: var(--color-surface-elevated);
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover .product-image {
          transform: scale(1.08);
        }
        .product-badge {
          top: var(--spacing-md);
          left: var(--spacing-md);
          color: white;
          z-index: 10;
          padding: var(--spacing-xs) var(--spacing-sm);
          position: absolute;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          border-radius: var(--border-radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .product-badge.sale { background: linear-gradient(135deg, #EF4444, #DC2626); }
        .product-badge.new { background: linear-gradient(135deg, var(--color-secondary), #0D9488); }
        .product-badge.bestseller { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); }
        
        .product-actions {
          top: var(--spacing-md);
          right: var(--spacing-md);
          gap: var(--spacing-xs);
          display: flex;
          z-index: 10;
          position: absolute;
          flex-direction: column;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.3s ease;
        }
        .product-card:hover .product-actions {
          opacity: 1;
          transform: translateX(0);
        }
        
        .product-action-btn {
          width: 36px;
          height: 36px;
          color: var(--color-on-surface);
          border: none;
          cursor: pointer;
          display: flex;
          background: var(--color-surface);
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          align-items: center;
          border-radius: var(--border-radius-full);
          justify-content: center;
        }
        .product-action-btn:hover {
          color: var(--color-surface);
          background: var(--color-primary);
          transform: scale(1.1);
        }
        .product-action-btn.wishlisted {
          color: var(--color-primary);
        }
        .product-action-btn.wishlisted:hover {
          color: var(--color-surface);
        }

        /* Add to Cart - Desktop Default (Hidden) */
        .product-add-cart {
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
          display: flex;
          padding: var(--spacing-md);
          position: absolute;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-add-cart {
          transform: translateY(0);
        }

        /* MOBILE OVERRIDES */
        @media (max-width: 767px) {
          /* Force actions visible */
          .product-actions {
            opacity: 1;
            transform: translateX(0);
          }
          /* Force Add to Cart visible */
          .product-add-cart {
            transform: translateY(0);
            /* Add a subtle gradient so it looks good over the image bottom */
            background: linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 100%);
          }
        }

        .product-add-cart-btn {
          flex: 1;
          gap: var(--spacing-xs);
          color: var(--color-surface);
          border: none;
          cursor: pointer;
          display: flex;
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: var(--font-size-sm);
          background: var(--color-primary);
          transition: all 0.3s ease;
          align-items: center;
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-medium);
          border-radius: var(--border-radius-md);
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .product-add-cart-btn:hover:not(:disabled) {
          background: var(--color-accent);
          transform: scale(1.02);
        }
        .product-add-cart-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .product-add-cart-btn.adding {
          animation: pulse 0.6s ease;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); }
        }
        .product-content {
          flex: 1;
          display: flex;
          padding: var(--spacing-lg);
          flex-direction: column;
        }
        .product-name {
          color: var(--color-on-surface);
          font-size: var(--font-size-base);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: 1.4;
          margin-bottom: var(--spacing-xs);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .product-rating {
          gap: var(--spacing-xs);
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        .product-stars {
          gap: 2px;
          display: flex;
        }
        .product-review-count {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
        }
        .product-price-row {
          gap: var(--spacing-sm);
          display: flex;
          margin-top: auto;
          align-items: baseline;
        }
        .product-price {
          color: var(--color-on-surface);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }
        .product-original-price {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
          text-decoration: line-through;
        }
        .product-discount {
          color: #EF4444;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }
        .product-out-of-stock {
          color: #EF4444;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }
        
        /* Like button with count */
        .product-like-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: var(--spacing-sm);
        }
        .product-like-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
          font-family: inherit;
          transition: all 0.2s ease;
          border-radius: var(--border-radius-sm);
        }
        .product-like-btn:hover {
          background: var(--color-surface-elevated);
        }
        .product-like-btn.liked {
          color: var(--color-primary);
        }
        .product-like-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        @keyframes spinIcon {
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spinIcon 0.8s linear infinite;
        }
      `}</style>

      <div 
        className="product-card"
        ref={cardRef}
      >
        <SafeLink href={`/product/${id}`} newTab={false} className="product-card-link">
          <div className="product-image-container">
            {badge && (
              <span className={`product-badge ${badgeType}`}>{badge}</span>
            )}
            
            <div className="product-actions">
              <button 
                className={`product-action-btn ${isLiked ? 'wishlisted' : ''}`}
                onClick={handleLikeToggle}
                disabled={isLiking}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                {isLiking ? (
                  <Loader2 size={18} className="spin-icon" />
                ) : (
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                )}
              </button>
              <button 
                className="product-action-btn"
                onClick={handleQuickView}
                aria-label="Quick view"
              >
                <Eye size={18} />
              </button>
            </div>

            <img 
              src={imageUrl} 
              alt={imageAlt || name}
              className="product-image"
              loading="lazy"
            />

            <div className="product-add-cart">
              <button 
                className="product-add-cart-btn"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart size={18} />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          <div className="product-content">
            <h3 className="product-name">{name}</h3>
            
            {rating !== undefined && rating > 0 && (
              <div className="product-rating">
                <div className="product-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < Math.round(rating) ? '#F59E0B' : 'none'}
                      color={i < Math.round(rating) ? '#F59E0B' : '#D1D5DB'}
                    />
                  ))}
                </div>
                {reviewCount !== undefined && reviewCount > 0 && (
                  <span className="product-review-count">({reviewCount})</span>
                )}
              </div>
            )}

            <div className="product-price-row">
              <span className="product-price">{formatPrice(price)} {currency}</span>
              {originalPrice && originalPrice > price && (
                <>
                  <span className="product-original-price">{formatPrice(originalPrice)}</span>
                  <span className="product-discount">-{discountPercent}%</span>
                </>
              )}
            </div>
            
            {/* Like count row */}
            <div className="product-like-row">
              <button 
                className={`product-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLikeToggle}
                disabled={isLiking}
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              </button>
              
              {!inStock && (
                <span className="product-out-of-stock">Out of Stock</span>
              )}
            </div>
          </div>
        </SafeLink>
      </div>

      {/* Add to Cart Modal */}
      <AddToCartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        onAddToCart={handleCartModalAdd}
        product={{
          id,
          name,
          price,
          imageUrl,
          sizes,
          colors,
          variants,
        }}
      />

      {/* Image Quick View Modal */}
      <ImageQuickViewModal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        images={[imageUrl]}
        productName={name}
      />
    </>
  );
}