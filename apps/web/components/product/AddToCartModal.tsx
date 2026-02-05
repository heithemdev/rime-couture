/**
 * Add to Cart Modal Component
 * Premium mobile-first design for selecting product variants before adding to cart
 * - Size selection with availability indicators
 * - Color selection with swatches
 * - Quantity selector with stock limits
 * - Loading states and success feedback
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';

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

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    sizes: Size[];
    colors: Color[];
    variants: Variant[];
  };
}

export default function AddToCartModal({
  isOpen,
  onClose,
  onAddToCart,
  product,
}: AddToCartModalProps) {
  // Selection state
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // UI state
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSizeId(null);
      setSelectedColorId(null);
      setQuantity(1);
      setError(null);
      setSuccess(false);
      setIsAdding(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Get in-stock variants
  const inStockVariants = useMemo(() => {
    return product.variants.filter((v) => v.stock > 0);
  }, [product.variants]);

  // Available sizes based on selected color
  const availableSizeIds = useMemo(() => {
    if (!selectedColorId) {
      return new Set(inStockVariants.map((v) => v.size?.id).filter(Boolean));
    }
    return new Set(
      inStockVariants
        .filter((v) => v.color?.id === selectedColorId)
        .map((v) => v.size?.id)
        .filter(Boolean)
    );
  }, [selectedColorId, inStockVariants]);

  // Available colors based on selected size
  const availableColorIds = useMemo(() => {
    if (!selectedSizeId) {
      return new Set(inStockVariants.map((v) => v.color?.id).filter(Boolean));
    }
    return new Set(
      inStockVariants
        .filter((v) => v.size?.id === selectedSizeId)
        .map((v) => v.color?.id)
        .filter(Boolean)
    );
  }, [selectedSizeId, inStockVariants]);

  // Find selected variant
  const selectedVariant = useMemo(() => {
    if (
      (product.sizes.length > 0 && !selectedSizeId) ||
      (product.colors.length > 0 && !selectedColorId)
    ) {
      return null;
    }

    return product.variants.find((v) => {
      const sizeMatch = product.sizes.length === 0 || v.size?.id === selectedSizeId;
      const colorMatch = product.colors.length === 0 || v.color?.id === selectedColorId;
      return sizeMatch && colorMatch;
    });
  }, [product.variants, product.sizes.length, product.colors.length, selectedSizeId, selectedColorId]);

  // Check if selection is complete
  const isSelectionComplete = useMemo(() => {
    return (
      (product.sizes.length === 0 || !!selectedSizeId) &&
      (product.colors.length === 0 || !!selectedColorId)
    );
  }, [product.sizes.length, product.colors.length, selectedSizeId, selectedColorId]);

  const canAddToCart = isSelectionComplete && selectedVariant && selectedVariant.stock > 0;

  // Current price
  const currentPrice = selectedVariant?.price ?? product.price;

  // Handle size selection
  const handleSizeClick = useCallback((sizeId: string) => {
    if (selectedSizeId === sizeId) {
      setSelectedSizeId(null);
      return;
    }

    setSelectedSizeId(sizeId);
    setQuantity(1);

    // Reset color if not available with new size
    if (selectedColorId) {
      const isValid = inStockVariants.some(
        (v) => v.size?.id === sizeId && v.color?.id === selectedColorId
      );
      if (!isValid) {
        setSelectedColorId(null);
      }
    }
  }, [selectedSizeId, selectedColorId, inStockVariants]);

  // Handle color selection
  const handleColorClick = useCallback((colorId: string) => {
    if (selectedColorId === colorId) {
      setSelectedColorId(null);
      return;
    }

    setSelectedColorId(colorId);
    setQuantity(1);

    // Reset size if not available with new color
    if (selectedSizeId) {
      const isValid = inStockVariants.some(
        (v) => v.color?.id === colorId && v.size?.id === selectedSizeId
      );
      if (!isValid) {
        setSelectedSizeId(null);
      }
    }
  }, [selectedColorId, selectedSizeId, inStockVariants]);

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant || !canAddToCart) return;

    setIsAdding(true);
    setError(null);

    try {
      await onAddToCart(selectedVariant.id, quantity);
      setSuccess(true);

      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, canAddToCart, quantity, onAddToCart, onClose]);

  // Format price
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .cart-modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--color-overlay);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cart-modal {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          background: var(--color-surface);
          border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        @media (min-width: 640px) {
          .cart-modal-overlay {
            align-items: center;
            padding: var(--spacing-xl);
          }
          .cart-modal {
            border-radius: var(--border-radius-xl);
            max-height: 85vh;
          }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .cart-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg) var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .cart-modal-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
        }

        .cart-modal-close {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-full);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-surface-secondary);
          transition: all 0.2s ease;
        }
        .cart-modal-close:hover {
          background: var(--color-border);
          color: var(--color-on-surface);
        }

        .cart-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        /* Product Preview */
        .product-preview {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .product-image {
          width: 80px;
          height: 100px;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          background: var(--color-surface-elevated);
          flex-shrink: 0;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-surface-secondary);
        }

        .product-info {
          flex: 1;
          min-width: 0;
        }

        .product-name {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-xs);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-price {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        /* Section */
        .selection-section {
          margin-bottom: var(--spacing-xl);
        }

        .section-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-md);
        }

        .section-selected {
          font-weight: var(--font-weight-body);
          color: var(--color-secondary);
        }

        /* Size Options */
        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .size-btn {
          min-width: 52px;
          height: 48px;
          padding: 0 var(--spacing-md);
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-on-surface);
        }
        .size-btn:hover:not(:disabled) {
          border-color: var(--color-primary);
        }
        .size-btn.selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .size-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          text-decoration: line-through;
          background: var(--color-surface-elevated);
        }

        /* Color Options */
        .color-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .color-btn {
          width: 48px;
          height: 48px;
          border: 3px solid var(--color-border);
          border-radius: var(--border-radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: none;
        }
        .color-btn:hover:not(:disabled) {
          transform: scale(1.08);
        }
        .color-btn.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary);
        }
        .color-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          filter: grayscale(0.8);
        }

        .color-swatch {
          width: 36px;
          height: 36px;
          border-radius: var(--border-radius-full);
        }

        .color-check {
          position: absolute;
          color: white;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }

        /* Quantity */
        .quantity-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          overflow: hidden;
        }

        .quantity-btn {
          width: 48px;
          height: 48px;
          border: none;
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-surface);
          transition: all 0.2s ease;
        }
        .quantity-btn:hover:not(:disabled) {
          background: var(--color-surface-elevated);
        }
        .quantity-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quantity-value {
          width: 56px;
          text-align: center;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-medium);
          border-left: 2px solid var(--color-border);
          border-right: 2px solid var(--color-border);
          padding: var(--spacing-md) 0;
        }

        .stock-info {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
        }
        .stock-info.low {
          color: var(--color-primary);
        }

        /* Error */
        .error-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--border-radius-md);
          color: #ef4444;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }

        /* Footer */
        .cart-modal-footer {
          padding: var(--spacing-lg) var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .add-btn {
          width: 100%;
          height: 56px;
          border: none;
          border-radius: var(--border-radius-control);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          transition: all 0.2s ease;
        }

        .add-btn.primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, #ff6b9d 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .add-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        .add-btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .add-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div className="cart-modal-overlay" onClick={onClose}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cart-modal-header">
            <h2 className="cart-modal-title">Add to Cart</h2>
            <button className="cart-modal-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="cart-modal-body">
            {/* Product Preview */}
            <div className="product-preview">
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder">
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">{formatPrice(currentPrice)}</div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="selection-section">
                <div className="section-label">
                  <span>Select Size</span>
                  {selectedSizeId && (
                    <span className="section-selected">
                      {product.sizes.find((s) => s.id === selectedSizeId)?.label}
                    </span>
                  )}
                </div>
                <div className="size-options">
                  {product.sizes.map((size) => {
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
              <div className="selection-section">
                <div className="section-label">
                  <span>Select Color</span>
                  {selectedColorId && (
                    <span className="section-selected">
                      {product.colors.find((c) => c.id === selectedColorId)?.label}
                    </span>
                  )}
                </div>
                <div className="color-options">
                  {product.colors.map((color) => {
                    const isAvailable = availableColorIds.has(color.id);
                    return (
                      <button
                        key={color.id}
                        className={`color-btn ${selectedColorId === color.id ? 'selected' : ''}`}
                        onClick={() => handleColorClick(color.id)}
                        disabled={!isAvailable}
                        title={color.label}
                      >
                        <div
                          className="color-swatch"
                          style={{ backgroundColor: color.hex || '#ccc' }}
                        />
                        {selectedColorId === color.id && (
                          <Check size={18} className="color-check" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="selection-section">
              <div className="section-label">Quantity</div>
              <div className="quantity-section">
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={20} />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!selectedVariant || quantity >= selectedVariant.stock}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {isSelectionComplete && selectedVariant ? (
                  <span className={`stock-info ${selectedVariant.stock < 10 ? 'low' : ''}`}>
                    {selectedVariant.stock} in stock
                  </span>
                ) : (
                  <span className="stock-info">Select options</span>
                )}
              </div>
            </div>
          </div>

          <div className="cart-modal-footer">
            <button
              className={`add-btn ${success ? 'success' : 'primary'}`}
              onClick={handleAddToCart}
              disabled={!canAddToCart || isAdding || success}
            >
              {isAdding ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Adding...
                </>
              ) : success ? (
                <>
                  <Check size={20} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  {canAddToCart
                    ? `Add to Cart • ${formatPrice(currentPrice * quantity)}`
                    : 'Select Options'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
