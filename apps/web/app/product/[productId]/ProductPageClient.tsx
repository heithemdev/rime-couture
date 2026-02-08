/**
 * Product Page Client Component
 * Interactive product page with smart variant filtering and accurate stock logic
 */

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Star,
  Heart,
  Share2,
  ShoppingBag,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  Tag,
  Ruler,
  Palette,
  Package,
  Clock,
  MessageCircle,
  User,
  ThumbsUp,
  PenLine,
  Loader2,
  Expand,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import ProductCheckoutModal, { type SelectedVariant } from '@/components/product/ProductCheckoutModal';
import ReviewModal from '@/components/product/ReviewModal';
import ImageQuickViewModal from '@/components/shared/ImageQuickViewModal';
import ProductCard from '@/components/shared/ProductCard';
import SafeLink from '@/components/shared/SafeLink';
import { useCart, useFingerprint } from '@/lib/cart-context';

// ============================================================================
// TYPES
// ============================================================================

interface Media {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationS?: number;
  isThumb: boolean;
  position: number;
  colorId?: string | null;
}

interface Size {
  id: string;
  code: string;
  label: string;
}

interface Color {
  id: string;
  code: string;
  hex?: string;
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

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  reviewerName: string;
  createdAt: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  price: {
    base: number;
    min: number;
    max: number;
    currency: string;
  };
  flags: {
    isCustomizable: boolean;
    isMadeToOrder: boolean;
    isFeatured: boolean;
  };
  leadTimeDays?: number;
  stats: {
    salesCount: number;
    reviewCount: number;
    avgRating: number;
    likeCount: number;
  };
  media: Media[];
  variants: Variant[];
  sizes: Size[];
  colors: Color[];
  tags: Record<string, Array<{ slug: string; label: string }>>;
  reviews: Review[];
}

interface ProductPageClientProps {
  product: Product;
  locale: string;
  isAdmin?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProductPageClient({ product, locale, isAdmin = false }: ProductPageClientProps) {
  // --------------------------------------------------------------------------
  // HOOKS
  // --------------------------------------------------------------------------
  const fingerprint = useFingerprint();
  const { addToCart } = useCart();
  const t = useTranslations('product');

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const cartSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Review & Like state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editingReview, setEditingReview] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(product.stats.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [reviews, setReviews] = useState(product.reviews);
  const [reviewCount, setReviewCount] = useState(product.stats.reviewCount);
  const [avgRating, setAvgRating] = useState(product.stats.avgRating);

  // Admin state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Related products state
  interface RelatedProduct {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    rating?: number;
    reviewCount?: number;
    likeCount?: number;
    inStock: boolean;
    sizes: Size[];
    colors: Color[];
    variants: Variant[];
  }
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // --------------------------------------------------------------------------
  // TRACK PRODUCT VIEW (once per product, not per fingerprint change)
  // --------------------------------------------------------------------------
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    // Guard: only fire once per product mount, not on fingerprint hydration
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;

    // Fire-and-forget — sessionId is optional, server deduplicates anyway
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'VIEW_PRODUCT',
        productId: product.id,
        sessionId: fingerprint || undefined,
        path: `/product/${product.slug}`,
      }),
    }).catch(() => {});
  }, [product.id, product.slug, fingerprint]);

  // --------------------------------------------------------------------------
  // FETCH LIKE & REVIEW STATUS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!fingerprint) return;

    // Check like status
    fetch(`/api/likes?productId=${product.id}&fingerprint=${fingerprint}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.isLiked !== undefined) setIsLiked(data.isLiked);
        if (data.likeCount !== undefined) setLikeCount(data.likeCount);
      })
      .catch(console.error);

    // Check review status
    fetch(`/api/reviews?productId=${product.id}&fingerprint=${fingerprint}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasReviewed !== undefined) setHasReviewed(data.hasReviewed);
        if (data.userReview) setUserReview(data.userReview);
      })
      .catch(console.error);
  }, [product.id, fingerprint]);

  // --------------------------------------------------------------------------
  // FETCH RELATED PRODUCTS (with abort + cache to prevent duplicate calls)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    const fetchRelatedProducts = async () => {
      try {
        setIsLoadingRelated(true);
        // Fetch products from same category, excluding current product
        const params = new URLSearchParams({
          categoryId: product.category.id,
          limit: '8',
          exclude: product.id,
        });
        const res = await fetch(`/api/products?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        
        if (data.products && Array.isArray(data.products)) {
          // Transform API response to RelatedProduct format
          const related = data.products.map((p: {
            id: string;
            slug: string;
            name: string;
            price: number;
            imageUrl: string;
            rating?: number;
            reviewCount?: number;
            likeCount?: number;
            inStock: boolean;
            sizes: Size[];
            colors: Color[];
            variants: Array<{
              id: string;
              variantKey: string;
              sku: string;
              price: number | null;
              stock: number;
              sizeId: string | null;
              colorId: string | null;
            }>;
          }) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price, // Already in DA from the listing API
            originalPrice: undefined,
            imageUrl: p.imageUrl || '/assets/placeholder.jpg',
            rating: p.rating,
            reviewCount: p.reviewCount,
            likeCount: p.likeCount,
            inStock: p.inStock,
            sizes: p.sizes || [],
            colors: p.colors || [],
            variants: (p.variants || []).map((v) => ({
              id: v.id,
              variantKey: v.variantKey,
              sku: v.sku,
              price: v.price, // Already in DA from the listing API
              stock: v.stock,
              size: (p.sizes || []).find((s: Size) => s.id === v.sizeId) || null,
              color: (p.colors || []).find((c: Color) => c.id === v.colorId) || null,
            })),
          }));
          setRelatedProducts(related);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching related products:', err);
      } finally {
        if (!controller.signal.aborted) setIsLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
    return () => controller.abort();
  }, [product.id, product.category.id]);

  // --------------------------------------------------------------------------
  // HANDLERS - LIKE
  // --------------------------------------------------------------------------
  const handleLikeToggle = useCallback(async () => {
    if (!fingerprint || isLiking) return;

    setIsLiking(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, fingerprint }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setIsLiking(false);
    }
  }, [product.id, fingerprint, isLiking]);

  // --------------------------------------------------------------------------
  // HANDLERS - REVIEW SUCCESS
  // --------------------------------------------------------------------------
  const handleReviewSuccess = useCallback(() => {
    setHasReviewed(true);
    setEditingReview(false);
    // Refresh reviews immediately
    fetch(`/api/reviews?productId=${product.id}&fingerprint=${fingerprint || ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews)) {
          // Transform the reviews to match our interface (dates come as ISO strings)
          const transformedReviews = data.reviews.map((r: Review & { createdAt: string | Date }) => ({
            ...r,
            createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
          }));
          setReviews(transformedReviews);
          setReviewCount(transformedReviews.length);
          // Calculate new avg
          if (transformedReviews.length > 0) {
            const total = transformedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
            setAvgRating(total / transformedReviews.length);
          }
        }
        if (data.userReview) setUserReview(data.userReview);
      })
      .catch(console.error);
  }, [product.id, fingerprint]);

  // Open review modal for editing
  const handleEditReview = useCallback(() => {
    setEditingReview(true);
    setShowReviewModal(true);
  }, []);

  // Open review modal for new review
  const handleWriteReview = useCallback(() => {
    setEditingReview(false);
    setShowReviewModal(true);
  }, []);

  // --------------------------------------------------------------------------
  // DERIVED STATE & LOGIC
  // --------------------------------------------------------------------------

  const images = useMemo(() => product.media.filter((m) => m.kind === 'IMAGE'), [product.media]);
  const videos = useMemo(() => product.media.filter((m) => m.kind === 'VIDEO'), [product.media]);

  // Filter media by selected color — show color-specific media + generic (no color) media
  // When no color is selected, show all media
  const allMedia = useMemo(() => {
    const all = [...images, ...videos];
    if (!selectedColorId) return all;
    const filtered = all.filter(
      (m) => m.colorId === selectedColorId || !m.colorId
    );
    return filtered.length > 0 ? filtered : all;
  }, [images, videos, selectedColorId]);

  const currentMedia = allMedia[selectedImageIndex];

  // 1. Get all variants that actually have stock
  const inStockVariants = useMemo(() => {
    return product.variants.filter((v) => v.stock > 0);
  }, [product.variants]);

  // 2. Determine Available SIZES based on selected COLOR
  // If a color is picked, only show sizes available in that color.
  const availableSizeIds = useMemo(() => {
    if (!selectedColorId) {
      // If no color selected, show all sizes that exist in any in-stock variant
      return new Set(inStockVariants.map((v) => v.size?.id).filter(Boolean));
    }
    // Filter variants by the selected color
    return new Set(
      inStockVariants
        .filter((v) => v.color?.id === selectedColorId)
        .map((v) => v.size?.id)
        .filter(Boolean)
    );
  }, [selectedColorId, inStockVariants]);

  // 3. Determine Available COLORS based on selected SIZE
  // If a size is picked, only show colors available in that size.
  const availableColorIds = useMemo(() => {
    if (!selectedSizeId) {
      // If no size selected, show all colors that exist in any in-stock variant
      return new Set(inStockVariants.map((v) => v.color?.id).filter(Boolean));
    }
    // Filter variants by the selected size
    return new Set(
      inStockVariants
        .filter((v) => v.size?.id === selectedSizeId)
        .map((v) => v.color?.id)
        .filter(Boolean)
    );
  }, [selectedSizeId, inStockVariants]);

  // 4. Find the Exact Variant matching current selections
  const selectedVariant = useMemo(() => {
    if ((product.sizes.length > 0 && !selectedSizeId) || (product.colors.length > 0 && !selectedColorId)) {
      return null;
    }

    // Handle products that might have only size or only color
    return product.variants.find((v) => {
      const sizeMatch = product.sizes.length === 0 || v.size?.id === selectedSizeId;
      const colorMatch = product.colors.length === 0 || v.color?.id === selectedColorId;
      return sizeMatch && colorMatch;
    });
  }, [product.variants, product.sizes.length, product.colors.length, selectedSizeId, selectedColorId]);

  // 5. Current Price & Stock Logic
  const currentPrice = selectedVariant?.price ?? product.price.base;
  
  // If variant is fully selected, we check its specific stock.
  // If not fully selected, we generally consider it "in stock" if there are options,
  // but button is disabled until selection is complete.
  const isSelectionComplete = 
    (product.sizes.length === 0 || !!selectedSizeId) && 
    (product.colors.length === 0 || !!selectedColorId);
  
  const canOrder = isSelectionComplete && selectedVariant && selectedVariant.stock > 0;

  // --------------------------------------------------------------------------
  // HANDLERS - ADD TO CART
  // --------------------------------------------------------------------------
  const handleAddToCart = useCallback(async () => {
    if (!canOrder || !selectedVariant || isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      const success = await addToCart(product.id, selectedVariant.id, quantity);
      if (success) {
        // Clear any previous timer
        if (cartSuccessTimerRef.current) clearTimeout(cartSuccessTimerRef.current);
        setShowCartSuccess(true);
        cartSuccessTimerRef.current = setTimeout(() => setShowCartSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setIsAddingToCart(false);
    }
  }, [canOrder, selectedVariant, isAddingToCart, addToCart, product.id, quantity]);

  // Cleanup success timer on unmount
  useEffect(() => {
    return () => {
      if (cartSuccessTimerRef.current) clearTimeout(cartSuccessTimerRef.current);
    };
  }, []);

  // --------------------------------------------------------------------------
  // HANDLERS (Strict Reset Logic)
  // --------------------------------------------------------------------------

  const handleSizeClick = (sizeId: string) => {
    if (selectedSizeId === sizeId) {
      setSelectedSizeId(null); // Deselect
      return;
    }

    // 1. Set Size
    setSelectedSizeId(sizeId);
    
    // 2. RESET QUANTITY TO 1 (Requested Requirement)
    setQuantity(1);

    // 3. Smart Filter: If current color is not available in new size, deselect color
    if (selectedColorId) {
      const isCombinationValid = inStockVariants.some(
        (v) => v.size?.id === sizeId && v.color?.id === selectedColorId
      );
      if (!isCombinationValid) {
        setSelectedColorId(null);
      }
    }
  };

  const handleColorClick = (colorId: string) => {
    if (selectedColorId === colorId) {
      setSelectedColorId(null); // Deselect
      setSelectedImageIndex(0); // Reset gallery to first image
      return;
    }

    // 1. Set Color
    setSelectedColorId(colorId);

    // 2. RESET QUANTITY TO 1 (Requested Requirement)
    setQuantity(1);

    // 3. Reset gallery to first image for the new color
    setSelectedImageIndex(0);

    // 4. Smart Filter: If current size is not available in new color, deselect size
    if (selectedSizeId) {
      const isCombinationValid = inStockVariants.some(
        (v) => v.color?.id === colorId && v.size?.id === selectedSizeId
      );
      if (!isCombinationValid) {
        setSelectedSizeId(null);
      }
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allMedia.length);
    setIsVideoPlaying(false);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    setIsVideoPlaying(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      // User cancelled the share dialog — ignore
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  // Admin Delete Handler
  const handleDeleteProduct = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Redirect to admin page after deletion
        window.location.href = '/admin';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const checkoutVariant: SelectedVariant | null = selectedVariant
    ? {
        id: selectedVariant.id,
        size: selectedVariant.size ? { code: selectedVariant.size.code, label: selectedVariant.size.label } : null,
        color: selectedVariant.color
          ? { code: selectedVariant.color.code, label: selectedVariant.color.label, hex: selectedVariant.color.hex }
          : null,
        price: currentPrice,
      }
    : null;

  // Render Stars Helper
  const renderStars = (rating: number, size = 16) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= Math.round(rating) ? 'var(--color-accent)' : 'transparent'}
          stroke={star <= Math.round(rating) ? 'var(--color-accent)' : 'var(--color-border)'}
        />
      ))}
    </div>
  );

  return (
    <>
      <style jsx>{`
        .product-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--spacing-xl);
        }
        
        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          margin-bottom: var(--spacing-xl);
        }
        .breadcrumb a {
          color: var(--color-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .breadcrumb a:hover {
          color: var(--color-primary);
        }
        .breadcrumb-separator {
          color: var(--color-border);
        }
        
        /* Main Layout */
        .product-layout {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: var(--spacing-3xl);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .product-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* Gallery */
        .gallery { position: relative; }
        .gallery-main {
          position: relative;
          aspect-ratio: 3 / 4;
          border-radius: var(--border-radius-xl);
          overflow: hidden;
          background: var(--color-surface-elevated);
          margin-bottom: var(--spacing-md);
        }
        .gallery-main img, .gallery-main video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .gallery-placeholder {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-border) 100%);
          color: var(--color-on-surface-secondary); gap: var(--spacing-md);
        }
        .gallery-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 48px; height: 48px; background: var(--color-surface);
          border: none; border-radius: var(--border-radius-full);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-level-2); transition: all 0.2s ease; z-index: 10;
        }
        .gallery-nav:hover { background: var(--color-primary); color: white; transform: translateY(-50%) scale(1.05); }
        .gallery-nav.prev { left: var(--spacing-md); }
        .gallery-nav.next { right: var(--spacing-md); }
        
        .gallery-play {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 80px; height: 80px; background: var(--color-primary);
          border: none; border-radius: var(--border-radius-full); cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: white;
          box-shadow: var(--shadow-level-3); transition: all 0.3s ease;
        }
        .gallery-play:hover { transform: translate(-50%, -50%) scale(1.1); }
        
        .gallery-expand {
          position: absolute; bottom: var(--spacing-md); right: var(--spacing-md);
          width: 44px; height: 44px; background: var(--color-surface);
          border: none; border-radius: var(--border-radius-full); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-on-surface); box-shadow: var(--shadow-level-2);
          transition: all 0.2s ease; z-index: 10; opacity: 0.9;
        }
        .gallery-expand:hover { 
          background: var(--color-primary); color: white; 
          transform: scale(1.1); opacity: 1;
        }
        
        .gallery-thumbnails {
          display: flex; gap: var(--spacing-sm); overflow-x: auto; padding-bottom: var(--spacing-sm);
        }
        .gallery-thumb {
          flex-shrink: 0; width: 80px; height: 80px; border-radius: var(--border-radius-md);
          overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.2s ease; position: relative;
        }
        .gallery-thumb.active { border-color: var(--color-primary); }
        .gallery-thumb:hover { transform: scale(1.05); }
        .gallery-thumb img, .gallery-thumb video { width: 100%; height: 100%; object-fit: cover; }
        
        /* Featured Badge */
        .featured-badge {
          position: absolute; top: var(--spacing-md); left: var(--spacing-md);
          background: linear-gradient(135deg, var(--color-accent) 0%, #FFB800 100%);
          color: var(--color-on-accent); padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--border-radius-full); font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold); display: flex; align-items: center;
          gap: var(--spacing-xs); z-index: 5;
        }
        
        /* Product Info Panel */
        .product-panel {
          position: sticky; top: calc(var(--spacing-xl) + 80px);
          background: var(--color-surface); border-radius: var(--border-radius-xl);
          padding: var(--spacing-xl); box-shadow: var(--shadow-level-2);
          border: 1px solid var(--color-border);
        }
        @media (max-width: 1024px) { .product-panel { position: static; } }
        
        /* Admin Actions */
        .admin-actions {
          display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-lg); border-bottom: 2px dashed var(--color-border);
        }
        .admin-btn {
          display: inline-flex; align-items: center; gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
          cursor: pointer; transition: all 0.2s ease; text-decoration: none; border: 2px solid;
        }
        .admin-edit-btn {
          background: var(--color-secondary); color: white; border-color: var(--color-secondary);
        }
        .admin-edit-btn:hover {
          background: #1e918d; transform: translateY(-1px);
        }
        .admin-delete-btn {
          background: transparent; color: #dc2626; border-color: #fecaca;
        }
        .admin-delete-btn:hover {
          background: #fef2f2; border-color: #dc2626;
        }
        
        /* Admin Delete Modal */
        .admin-delete-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--spacing-md);
        }
        .admin-delete-modal-content {
          background: white; border-radius: var(--border-radius-xl); padding: var(--spacing-xl);
          max-width: 400px; width: 100%; text-align: center;
        }
        .admin-delete-modal-content h3 {
          font-size: var(--font-size-xl); margin-bottom: var(--spacing-md);
        }
        .admin-delete-modal-content p {
          color: var(--color-on-surface-secondary); margin-bottom: var(--spacing-lg);
        }
        .admin-delete-modal-actions {
          display: flex; gap: var(--spacing-md); justify-content: center;
        }
        .admin-delete-modal-actions button {
          padding: var(--spacing-sm) var(--spacing-lg); border-radius: var(--border-radius-md);
          font-weight: var(--font-weight-semibold); cursor: pointer; transition: all 0.2s;
        }
        .admin-cancel-btn {
          background: transparent; color: var(--color-on-surface-secondary);
          border: 2px solid var(--color-border);
        }
        .admin-cancel-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .admin-confirm-delete-btn {
          background: #dc2626; color: white; border: none;
          display: inline-flex; align-items: center; gap: var(--spacing-xs);
        }
        .admin-confirm-delete-btn:hover { background: #b91c1c; }
        .admin-confirm-delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .panel-header { margin-bottom: var(--spacing-lg); }
        .panel-category {
          display: inline-flex; align-items: center; gap: var(--spacing-xs);
          background: var(--color-surface-elevated); color: var(--color-secondary);
          padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--spacing-md);
        }
        .panel-name {
          font-size: var(--font-size-2xl); font-weight: var(--font-weight-heading);
          color: var(--color-on-surface); line-height: var(--line-height-heading);
          margin-bottom: var(--spacing-md);
        }
        
        .panel-rating {
          display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);
        }
        .panel-rating :global(.stars) { display: flex; gap: 2px; }
        .panel-rating-text { font-size: var(--font-size-sm); color: var(--color-on-surface-secondary); }
        .panel-rating-count { color: var(--color-secondary); font-weight: var(--font-weight-medium); }
        
        .panel-price {
          font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold);
          color: var(--color-primary); margin-bottom: var(--spacing-sm);
        }
        .panel-price-range {
          font-size: var(--font-size-sm); color: var(--color-on-surface-secondary); margin-bottom: var(--spacing-lg);
        }
        
        /* Variant Selection */
        .variant-section {
          margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--color-border);
        }
        .variant-label {
          display: flex; align-items: center; gap: var(--spacing-xs);
          font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
          color: var(--color-on-surface); margin-bottom: var(--spacing-sm);
        }
        .variant-label svg { color: var(--color-secondary); }
        
        .size-options { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
        .size-btn {
          min-width: 48px; height: 48px; padding: 0 var(--spacing-md);
          border: 2px solid var(--color-border); background: var(--color-surface);
          border-radius: var(--border-radius-md); font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium); cursor: pointer; transition: all 0.2s ease;
        }
        .size-btn:hover:not(:disabled) { border-color: var(--color-primary); }
        .size-btn.selected {
          background: var(--color-primary); border-color: var(--color-primary); color: white;
        }
        .size-btn:disabled {
          opacity: 0.3; cursor: not-allowed; text-decoration: line-through; background: var(--color-surface-elevated);
        }
        
        .color-options { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
        .color-btn {
          width: 44px; height: 44px; border: 3px solid var(--color-border);
          border-radius: var(--border-radius-full); cursor: pointer; transition: all 0.2s ease;
          position: relative; display: flex; align-items: center; justify-content: center;
        }
        .color-btn:hover:not(:disabled) { transform: scale(1.1); }
        .color-btn.selected {
          border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary);
        }
        .color-btn:disabled {
          opacity: 0.3; cursor: not-allowed; filter: grayscale(0.8);
        }
        .color-btn .check-icon {
          color: white; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        
        /* Quantity */
        .quantity-section {
          display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
        }
        .quantity-label {
          font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-on-surface);
        }
        .quantity-controls {
          display: flex; align-items: center; border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md); overflow: hidden;
        }
        .quantity-btn {
          width: 44px; height: 44px; border: none; background: var(--color-surface);
          cursor: pointer; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
          color: var(--color-on-surface); transition: all 0.2s ease;
        }
        .quantity-btn:hover:not(:disabled) { background: var(--color-surface-elevated); }
        .quantity-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .quantity-value {
          width: 50px; text-align: center; font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium); border-left: 1px solid var(--color-border);
          border-right: 1px solid var(--color-border); padding: var(--spacing-sm) 0;
        }
        
        /* Action Buttons */
        .action-buttons { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
        .order-btn {
          flex: 1; height: 56px; background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          color: white; border: none; border-radius: var(--border-radius-control);
          font-size: var(--font-size-base); font-weight: var(--font-weight-bold);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: var(--spacing-sm); box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3); transition: all 0.3s ease;
        }
        .order-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4); }
        .order-btn:disabled { opacity: 0.6; cursor: not-allowed; background: var(--color-border); box-shadow: none; }
        
        .icon-btn {
          width: 56px; height: 56px; border: 2px solid var(--color-border); background: var(--color-surface);
          border-radius: var(--border-radius-control); cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all 0.2s ease;
        }
        .icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .icon-btn.wishlisted { background: var(--color-primary); border-color: var(--color-primary); color: white; }
        
        /* Cart Button */
        .cart-btn {
          width: 56px; height: 56px; border: 2px solid var(--color-secondary);
          background: var(--color-secondary); border-radius: var(--border-radius-control);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: white; transition: all 0.2s ease;
        }
        .cart-btn:hover:not(:disabled) { 
          background: var(--color-secondary-dark, #2563eb); 
          transform: scale(1.05);
        }
        .cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        /* Cart Success Toast */
        .cart-success-toast {
          display: flex; align-items: center; gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: var(--border-radius-control);
          color: white; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
          animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
        }
        .cart-success-toast::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; background: rgba(255,255,255,0.4);
          animation: toast-progress 2.5s linear forwards;
        }
        .cart-success-icon {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          animation: toast-check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }
        .cart-success-text {
          display: flex; flex-direction: column; gap: 2px;
          min-width: 0; flex: 1;
        }
        .cart-success-title {
          font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
          line-height: 1.2;
        }
        .cart-success-detail {
          font-size: 12px; opacity: 0.85;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cart-success-close {
          background: rgba(255,255,255,0.2); border: none; color: white;
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: background 0.2s;
        }
        .cart-success-close:hover { background: rgba(255,255,255,0.35); }

        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-check-pop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        /* Like Button */
        .like-btn {
          min-width: 80px; height: 56px; padding: 0 var(--spacing-lg);
          border: 2px solid var(--color-border); background: var(--color-surface);
          border-radius: var(--border-radius-control); cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: var(--spacing-sm);
          font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
          color: var(--color-on-surface); transition: all 0.2s ease;
        }
        .like-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
        .like-btn.liked { 
          background: linear-gradient(135deg, #ff4d81 0%, #ff6b9d 100%);
          border-color: var(--color-primary); color: white;
        }
        .like-btn:disabled { opacity: 0.7; cursor: wait; }
        .like-count { font-variant-numeric: tabular-nums; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        
        /* Trust Features - Always Horizontal */
        .trust-features {
          display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-sm);
          padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border);
        }
        .trust-item { 
          display: flex; align-items: center; gap: var(--spacing-xs);
          flex: 1; justify-content: center;
        }
        .trust-icon {
          width: 36px; height: 36px; background: var(--color-surface-elevated);
          border-radius: var(--border-radius-full); display: flex; align-items: center;
          justify-content: center; color: var(--color-secondary); flex-shrink: 0;
        }
        .trust-text { font-size: var(--font-size-xs); color: var(--color-on-surface-secondary); line-height: 1.3; }

        /* Shipping Estimate */
        .shipping-estimate {
          margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--color-surface-elevated);
          border-radius: var(--border-radius-lg); border: 1px dashed var(--color-border);
        }
        .shipping-estimate-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
        .shipping-estimate-icon {
          width: 32px; height: 32px; background: var(--color-secondary); border-radius: var(--border-radius-sm);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .shipping-estimate-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-on-surface); }
        .shipping-estimate-range { font-size: var(--font-size-xs); color: var(--color-on-surface-secondary); padding-left: 40px; display: flex; align-items: center; gap: var(--spacing-xs); }
        .shipping-estimate-price { color: var(--color-secondary); font-weight: var(--font-weight-medium); }
        
        /* Details & Reviews CSS ... (Same as original but omitted for brevity) */
        .details-section { margin-top: var(--spacing-3xl); }
        .section-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-heading); color: var(--color-on-surface); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm); }
        .section-title svg { color: var(--color-primary); }
        .description-box { background: var(--color-surface-elevated); border-radius: var(--border-radius-lg); padding: var(--spacing-xl); line-height: 1.8; color: var(--color-on-surface); white-space: pre-wrap; }
        .tags-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); margin-top: var(--spacing-xl); }
        .tag-group { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: var(--spacing-lg); }
        .tag-group-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-xs); }
        .tag-list { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
        .tag-chip { background: var(--color-surface-elevated); padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--border-radius-full); font-size: var(--font-size-sm); color: var(--color-on-surface); }
        
        .reviews-section { margin-top: var(--spacing-3xl); padding-top: var(--spacing-3xl); border-top: 2px solid var(--color-border); }
        .reviews-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--spacing-xl); flex-wrap: wrap; gap: var(--spacing-lg); }
        .reviews-summary { display: flex; align-items: center; gap: var(--spacing-lg); margin-top: var(--spacing-md); }
        .reviews-avg { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--color-on-surface); }
        .reviews-avg-stars { display: flex; flex-direction: column; gap: var(--spacing-xs); }
        .reviews-avg-stars :global(.stars) { display: flex; gap: 2px; }
        .reviews-count-text { font-size: var(--font-size-sm); color: var(--color-on-surface-secondary); }
        .reviews-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
        .review-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: var(--spacing-xl); }
        .review-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--spacing-md); }
        .review-author { display: flex; align-items: center; gap: var(--spacing-md); }
        .review-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%); border-radius: var(--border-radius-full); display: flex; align-items: center; justify-content: center; color: white; }
        .review-author-info h4 { font-weight: var(--font-weight-medium); color: var(--color-on-surface); margin-bottom: var(--spacing-xs); }
        .review-date { font-size: var(--font-size-xs); color: var(--color-on-surface-secondary); }
        .review-rating { display: flex; align-items: center; gap: 2px; }
        .review-rating :global(.stars) { display: flex; flex-direction: row; gap: 2px; }
        .review-title { font-weight: var(--font-weight-medium); color: var(--color-on-surface); margin-bottom: var(--spacing-sm); }
        .review-comment { color: var(--color-on-surface-secondary); line-height: 1.7; }
        .no-reviews { text-align: center; padding: var(--spacing-3xl); background: var(--color-surface-elevated); border-radius: var(--border-radius-lg); }
        .no-reviews-icon { width: 64px; height: 64px; background: var(--color-border); border-radius: var(--border-radius-full); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--spacing-lg); color: var(--color-on-surface-secondary); }
        
        /* Add Review Button */
        .add-review-btn {
          display: flex; align-items: center; gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          background: var(--color-surface); border: 2px solid var(--color-primary);
          border-radius: var(--border-radius-control); color: var(--color-primary);
          font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
          font-family: inherit; cursor: pointer; transition: all 0.2s ease;
          white-space: nowrap;
        }
        .add-review-btn:hover:not(:disabled) {
          background: var(--color-primary); color: white;
        }
        .add-review-btn:disabled {
          opacity: 0.5; cursor: not-allowed; border-color: var(--color-border); color: var(--color-on-surface-secondary);
        }
        .add-review-btn.primary-cta {
          margin-top: var(--spacing-lg);
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          border-color: transparent; color: white;
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .add-review-btn.primary-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        
        @media (max-width: 640px) {
          .reviews-header { flex-direction: column; align-items: flex-start; }
          .add-review-btn { width: 100%; justify-content: center; }
        }
        
        /* Related Products Section */
        .related-products-section {
          margin-top: var(--spacing-3xl);
          padding-top: var(--spacing-3xl);
          border-top: 2px solid var(--color-border);
        }
        .related-products-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-xl);
        }
        .related-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
        }
        @media (max-width: 1100px) {
          .related-products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 800px) {
          .related-products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }
        }
        @media (max-width: 500px) {
          .related-products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-sm);
          }
        }
        .view-all-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .view-all-link:hover {
          color: var(--color-accent);
          gap: var(--spacing-sm);
        }
        .related-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-3xl);
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* ================================================================
           MOBILE RESPONSIVE STYLES
           ================================================================ */
        @media (max-width: 768px) {
          .product-page {
            padding: var(--spacing-md);
          }
          
          .breadcrumb {
            font-size: var(--font-size-xs);
            flex-wrap: wrap;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-md);
          }
          
          .product-layout {
            gap: var(--spacing-lg);
          }
          
          .gallery-main {
            aspect-ratio: 1 / 1;
            border-radius: var(--border-radius-lg);
          }
          
          .gallery-nav {
            width: 40px;
            height: 40px;
          }
          .gallery-nav.prev { left: var(--spacing-sm); }
          .gallery-nav.next { right: var(--spacing-sm); }
          
          .gallery-thumbnails {
            gap: var(--spacing-xs);
            padding: var(--spacing-xs) 0;
          }
          
          .gallery-thumb {
            width: 60px;
            height: 60px;
          }
          
          .product-panel {
            padding: var(--spacing-md);
            border-radius: var(--border-radius-lg);
          }
          
          .panel-name {
            font-size: var(--font-size-xl);
          }
          
          .panel-price {
            font-size: var(--font-size-2xl);
          }
          
          .variant-section {
            margin-bottom: var(--spacing-md);
            padding-bottom: var(--spacing-md);
          }
          
          .size-options,
          .color-options {
            gap: var(--spacing-xs);
          }
          
          .size-btn {
            min-width: 44px;
            height: 44px;
            font-size: var(--font-size-xs);
          }
          
          .color-btn {
            width: 40px;
            height: 40px;
          }
          
          .quantity-section {
            flex-wrap: wrap;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-md);
          }
          
          .quantity-btn {
            width: 40px;
            height: 40px;
          }
          
          .action-buttons {
            flex-wrap: wrap;
            gap: var(--spacing-sm);
          }
          
          .order-btn {
            flex: 1 1 100%;
            height: 52px;
            order: 1;
          }
          
          .cart-btn,
          .like-btn,
          .icon-btn {
            width: 52px;
            height: 52px;
            flex-shrink: 0;
            order: 2;
          }
          
          .like-btn {
            min-width: auto;
            padding: 0;
          }
          
          .like-count {
            display: none;
          }
          
          .trust-features {
            gap: var(--spacing-xs);
          }
          
          .trust-item {
            flex-direction: row;
            justify-content: center;
            gap: var(--spacing-xs);
          }
          
          .trust-icon {
            width: 32px;
            height: 32px;
          }
          
          .trust-text {
            font-size: 10px;
          }
          
          .shipping-estimate {
            margin-top: var(--spacing-md);
            padding: var(--spacing-sm);
          }
          
          .shipping-estimate-header {
            gap: var(--spacing-xs);
          }
          
          .shipping-estimate-icon {
            width: 28px;
            height: 28px;
          }
          
          .shipping-estimate-range {
            padding-left: 36px;
            font-size: var(--font-size-xs);
          }
          
          .details-section {
            margin-top: var(--spacing-xl);
          }
          
          .section-title {
            font-size: var(--font-size-lg);
          }
          
          .description-box {
            padding: var(--spacing-md);
            font-size: var(--font-size-sm);
          }
          
          .tags-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-sm);
          }
          
          .tag-group {
            padding: var(--spacing-sm);
          }
          
          .reviews-section {
            margin-top: var(--spacing-xl);
            padding-top: var(--spacing-xl);
          }
          
          .reviews-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
          
          .reviews-avg {
            font-size: var(--font-size-3xl);
          }
          
          .review-card {
            padding: var(--spacing-md);
          }
          
          .review-header {
            flex-direction: column;
            gap: var(--spacing-sm);
          }
          
          .review-avatar {
            width: 40px;
            height: 40px;
          }
        }
        
        @media (max-width: 480px) {
          .product-page {
            padding: var(--spacing-sm);
          }
          
          .panel-category {
            font-size: 10px;
            padding: 2px var(--spacing-sm);
          }
          
          .panel-name {
            font-size: var(--font-size-lg);
            line-height: 1.3;
          }
          
          .panel-price {
            font-size: var(--font-size-xl);
          }
          
          .panel-rating {
            flex-wrap: wrap;
            gap: var(--spacing-xs);
          }
          
          .action-buttons {
            gap: var(--spacing-xs);
          }
          
          .order-btn {
            height: 48px;
            font-size: var(--font-size-sm);
          }
          
          .cart-btn,
          .like-btn,
          .icon-btn {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      <div className="product-page">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">{t('breadcrumb.home')}</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/shopping">{t('breadcrumb.shop')}</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/shopping?category=${product.category.slug}`}>{product.category.name}</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{product.name}</span>
        </nav>

        {/* Main Layout */}
        <div className="product-layout">
          {/* Gallery */}
          <div className="gallery">
            <div className="gallery-main">
              {product.flags.isFeatured && (
                <div className="featured-badge">
                  <Sparkles size={14} />
                  {t('featured')}
                </div>
              )}
              
              {currentMedia?.kind === 'VIDEO' ? (
                isVideoPlaying ? (
                  <video
                    src={currentMedia.url}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <>
                    <video
                      src={currentMedia.url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button className="gallery-play" onClick={() => setIsVideoPlaying(true)}>
                      <Play size={32} fill="white" />
                    </button>
                  </>
                )
              ) : currentMedia?.url ? (
                <>
                  <img 
                    src={currentMedia.url} 
                    alt={product.name}
                    onClick={() => setShowImageModal(true)}
                    style={{ cursor: 'zoom-in' }}
                  />
                  <button 
                    className="gallery-expand" 
                    onClick={() => setShowImageModal(true)}
                    aria-label="View fullscreen"
                  >
                    <Expand size={20} />
                  </button>
                </>
              ) : (
                <div className="gallery-placeholder">
                  <Package size={40} />
                  <span>{t('noImage')}</span>
                </div>
              )}

              {allMedia.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevImage}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="gallery-nav next" onClick={nextImage}>
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allMedia.length > 1 && (
              <div className="gallery-thumbnails">
                {allMedia.map((media, index) => (
                  <div
                    key={media.id}
                    className={`gallery-thumb ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setIsVideoPlaying(false);
                    }}
                  >
                    {media.kind === 'VIDEO' ? (
                      <>
                        <video src={media.url} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                          <Play size={20} fill="white" color="white" />
                        </div>
                      </>
                    ) : (
                      <img src={media.url} alt={`${product.name} ${index + 1}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Product Description */}
            <div className="details-section">
              <h2 className="section-title"><Package size={24} /> {t('description')}</h2>
              <div className="description-box">{product.description}</div>
              {Object.keys(product.tags).length > 0 && (
                <div className="tags-grid">
                  {Object.entries(product.tags).map(([type, tags]) => {
                    return (
                      <div key={type} className="tag-group">
                        <div className="tag-group-title"><Tag size={14} />{t(`tagTypes.${type}`)}</div>
                        <div className="tag-list">
                          {tags.map((tag) => (
                            <span key={tag.slug} className="tag-chip">{tag.label}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Product Panel (Sticky) */}
          <div className="product-panel">
            {/* Admin Actions */}
            {isAdmin && (
              <div className="admin-actions">
                <Link href={`/admin/product/${product.id}`} className="admin-btn admin-edit-btn">
                  <Edit3 size={16} />
                  Edit Product
                </Link>
                <button 
                  className="admin-btn admin-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}

            <div className="panel-header">
              <div className="panel-category"><Tag size={12} />{product.category.name}</div>
              <h1 className="panel-name">{product.name}</h1>
              
              <div className="panel-rating">
                {renderStars(product.stats.avgRating)}
                <span className="panel-rating-text">
                  <span className="panel-rating-count">{product.stats.avgRating.toFixed(1)}</span>
                  {' '}{t('reviewsCount', { count: product.stats.reviewCount })}
                </span>
              </div>
              
              <div className="panel-price">{formatPrice(currentPrice)}</div>
              {product.price.min !== product.price.max && (
                <div className="panel-price-range">
                  {t('priceRange')}: {formatPrice(product.price.min)} - {formatPrice(product.price.max)}
                </div>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="variant-section">
                <div className="variant-label">
                  <Ruler size={16} /> {t('selectSize')}
                </div>
                <div className="size-options">
                  {product.sizes.map((size) => {
                    // Check if this size is available given the current color selection
                    const isAvailable = availableSizeIds.has(size.id);
                    return (
                      <button
                        key={size.id}
                        className={`size-btn ${selectedSizeId === size.id ? 'selected' : ''}`}
                        onClick={() => handleSizeClick(size.id)}
                        disabled={!isAvailable}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="variant-section">
                <div className="variant-label">
                  <Palette size={16} /> {t('selectColor')}
                  {selectedColorId && (
                    <span style={{ fontWeight: 'normal', marginLeft: 'auto' }}>
                      {product.colors.find((c) => c.id === selectedColorId)?.label}
                    </span>
                  )}
                </div>
                <div className="color-options">
                  {product.colors.map((color) => {
                    // Check if this color is available given the current size selection
                    const isAvailable = availableColorIds.has(color.id);
                    return (
                      <button
                        key={color.id}
                        className={`color-btn ${selectedColorId === color.id ? 'selected' : ''}`}
                        style={{ backgroundColor: color.hex || '#ccc' }}
                        onClick={() => handleColorClick(color.id)}
                        disabled={!isAvailable}
                        title={color.label}
                      >
                        {selectedColorId === color.id && <Check size={18} className="check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="quantity-section">
              <span className="quantity-label">{t('quantity')}</span>
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => setQuantity(quantity + 1)}
                  // Disable if quantity reaches stock limit, or if no variant is fully selected yet
                  disabled={!selectedVariant || quantity >= selectedVariant.stock}
                >
                  +
                </button>
              </div>
              
              {/* Detailed Stock Status Display */}
              {isSelectionComplete && selectedVariant ? (
                <span style={{ fontSize: 'var(--font-size-xs)', color: selectedVariant.stock < 10 ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                  {selectedVariant.stock} {t('unitsAvailable')}
                </span>
              ) : (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-on-surface-secondary)' }}>
                  {t('selectOptions')}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="order-btn"
                onClick={() => setShowCheckout(true)}
                disabled={!canOrder}
              >
                <ShoppingBag size={20} />
                {canOrder 
                  ? t('orderNow') 
                  : !isSelectionComplete 
                    ? t('selectOptionsBtn') 
                    : t('outOfStock')}
              </button>
              
              {/* Add to Cart Button */}
              <button
                className="cart-btn"
                onClick={handleAddToCart}
                disabled={!canOrder || isAddingToCart}
              >
                {isAddingToCart ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <ShoppingCart size={20} />
                )}
              </button>
              
              {/* Like Button with Count */}
              <button
                className={`like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLikeToggle}
                disabled={isLiking}
              >
                {isLiking ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                )}
                <span className="like-count">{likeCount}</span>
              </button>
              
              <button className="icon-btn" onClick={handleShare}>
                <Share2 size={22} />
              </button>
            </div>

            {/* ── Added to Cart Success Popup ── */}
            {showCartSuccess && (
              <div className="cart-success-toast">
                <div className="cart-success-icon">
                  <Check size={20} />
                </div>
                <div className="cart-success-text">
                  <span className="cart-success-title">{t('addedToCart')}</span>
                  <span className="cart-success-detail">{product.name} × {quantity}</span>
                </div>
                <button className="cart-success-close" onClick={() => setShowCartSuccess(false)}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Trust Features */}
            <div className="trust-features">
              <div className="trust-item"><div className="trust-icon"><Truck size={20} /></div><div className="trust-text">{t('fastDelivery')}</div></div>
              <div className="trust-item"><div className="trust-icon"><Shield size={20} /></div><div className="trust-text">{t('securePayment')}</div></div>
              <div className="trust-item"><div className="trust-icon"><RotateCcw size={20} /></div><div className="trust-text">{t('easyReturns')}</div></div>
            </div>

            {/* Shipping Estimate */}
            <div className="shipping-estimate">
              <div className="shipping-estimate-header">
                <div className="shipping-estimate-icon"><Truck size={16} /></div>
                <span className="shipping-estimate-title">{t('shipping.title')}</span>
              </div>
              <div className="shipping-estimate-range">
                {t('shipping.description')}
              </div>
            </div>

            {product.flags.isMadeToOrder && product.leadTimeDays && (
              <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--color-surface-elevated)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-on-surface-secondary)' }}>
                <Clock size={16} style={{ color: 'var(--color-secondary)' }} />
                {t('madeToOrder', { days: product.leadTimeDays })}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="reviews-section">
          <div className="reviews-header">
            <div>
              <h2 className="section-title"><MessageCircle size={24} /> {t('customerReviews')}</h2>
              <div className="reviews-summary">
                <span className="reviews-avg">{avgRating.toFixed(1)}</span>
                <div className="reviews-avg-stars">
                  {renderStars(avgRating, 20)}
                  <span className="reviews-count-text">{t('basedOn', { count: reviewCount })}</span>
                </div>
              </div>
            </div>
            
            {/* Add Review Button */}
            {hasReviewed ? (
              <button
                className="add-review-btn"
                onClick={handleEditReview}
              >
                <PenLine size={18} />
                {t('editReview')}
              </button>
            ) : (
              <button
                className="add-review-btn"
                onClick={handleWriteReview}
              >
                <PenLine size={18} />
                {t('writeReview')}
              </button>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      <div className="review-avatar"><User size={24} /></div>
                      <div className="review-author-info">
                        <h4>{review.reviewerName}</h4>
                        <span className="review-date">{formatDate(review.createdAt, locale)}</span>
                      </div>
                    </div>
                    <div className="review-rating">{renderStars(review.rating)}</div>
                  </div>
                  {review.title && <div className="review-title">{review.title}</div>}
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <div className="no-reviews-icon"><ThumbsUp size={28} /></div>
              <h3>{t('noReviews')}</h3>
              <p>{t('beFirstReviewer')}</p>
              <button
                className="add-review-btn primary-cta"
                onClick={handleWriteReview}
              >
                <PenLine size={18} />
                {t('writeFirstReview')}
              </button>
            </div>
          )}
        </section>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <div className="related-products-header">
              <h2 className="section-title"><Package size={24} /> {t('youMayAlsoLike')}</h2>
              <SafeLink href={`/shopping?category=${product.category.slug}`} className="view-all-link">
                {t('viewAll')} <ChevronRight size={18} />
              </SafeLink>
            </div>
            <div className="related-products-grid">
              {relatedProducts.slice(0, 4).map((rp) => (
                <ProductCard
                  key={rp.id}
                  id={rp.id}
                  slug={rp.slug}
                  name={rp.name}
                  price={rp.price}
                  originalPrice={rp.originalPrice}
                  imageUrl={rp.imageUrl}
                  rating={rp.rating}
                  reviewCount={rp.reviewCount}
                  likeCount={rp.likeCount}
                  inStock={rp.inStock}
                  sizes={rp.sizes}
                  colors={rp.colors}
                  variants={rp.variants}
                />
              ))}
            </div>
          </section>
        )}

        {isLoadingRelated && (
          <section className="related-products-section">
            <div className="related-products-header">
              <h2 className="section-title"><Package size={24} /> {t('youMayAlsoLike')}</h2>
            </div>
            <div className="related-loading">
              <Loader2 size={24} className="spin" /> {t('loadingRelated')}
            </div>
          </section>
        )}
      </div>

      <ProductCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        product={{
          id: product.id,
          name: product.name,
          price: currentPrice,
          imageUrl: images[0]?.url,
        }}
        quantity={quantity}
        selectedVariant={checkoutVariant}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(false);
        }}
        onSuccess={handleReviewSuccess}
        productId={product.id}
        productName={product.name}
        fingerprint={fingerprint}
        editMode={editingReview}
        existingReview={userReview}
      />

      <ImageQuickViewModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={images.map(img => img.url)}
        productName={product.name}
        initialIndex={selectedImageIndex}
      />

      {/* Admin Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="admin-delete-modal" onClick={() => setShowDeleteConfirm(false)}>
          <div className="admin-delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product?</h3>
            <p>
              This action cannot be undone. The product <strong>{product.name}</strong> and all its data will be permanently removed.
            </p>
            <div className="admin-delete-modal-actions">
              <button className="admin-cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="admin-confirm-delete-btn" 
                onClick={handleDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}