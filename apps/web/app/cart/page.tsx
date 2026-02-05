/**
 * Cart Page
 * Clean, professional shopping cart with intentional design
 * No vibe-coded elements - follows 8pt grid system
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { useCart } from '@/lib/cart-context';
import ProductCheckoutModal from '@/components/product/ProductCheckoutModal';

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(amountMinor: number): string {
  const amount = amountMinor / 100;
  return `${amount.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CartPage() {
  const t = useTranslations('cart');
  const { items, updateQuantity, removeFromCart, isLoading, subtotal, itemCount } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Debounce quantity updates - store pending quantity and timer
  const pendingQuantityRef = useRef<Map<string, { quantity: number; timer: NodeJS.Timeout }>>(new Map());
  const [localQuantities, setLocalQuantities] = useState<Map<string, number>>(new Map());

  // Sync local quantities with cart items
  useEffect(() => {
    const newMap = new Map<string, number>();
    items.forEach(item => {
      // Only set if not currently being edited
      if (!pendingQuantityRef.current.has(item.id)) {
        newMap.set(item.id, item.quantity);
      } else {
        // Keep the local pending value
        const pending = pendingQuantityRef.current.get(item.id);
        if (pending) {
          newMap.set(item.id, pending.quantity);
        }
      }
    });
    setLocalQuantities(prev => {
      // Merge - keep local values for items being edited
      const merged = new Map(newMap);
      prev.forEach((val, key) => {
        if (pendingQuantityRef.current.has(key)) {
          merged.set(key, val);
        }
      });
      return merged;
    });
  }, [items]);

  // Debounced quantity change handler (1.5s delay)
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number, maxStock: number) => {
    // Clamp quantity
    const clampedQuantity = Math.max(1, Math.min(newQuantity, maxStock));
    
    // Update local state immediately for responsive UI
    setLocalQuantities(prev => new Map(prev).set(itemId, clampedQuantity));
    
    // Clear existing timer for this item
    const existing = pendingQuantityRef.current.get(itemId);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }
    
    // Set new pending update with 1.5s debounce
    const timer = setTimeout(async () => {
      setUpdatingId(itemId);
      try {
        await updateQuantity(itemId, clampedQuantity);
      } catch (error) {
        console.error('Failed to update quantity:', error);
        // Revert local quantity on error
        const item = items.find(i => i.id === itemId);
        if (item) {
          setLocalQuantities(prev => new Map(prev).set(itemId, item.quantity));
        }
      } finally {
        setUpdatingId(null);
        pendingQuantityRef.current.delete(itemId);
      }
    }, 1500);
    
    pendingQuantityRef.current.set(itemId, { quantity: clampedQuantity, timer });
  }, [updateQuantity, items]);

  const handleRemove = useCallback(async (itemId: string) => {
    // Clear any pending quantity update
    const pending = pendingQuantityRef.current.get(itemId);
    if (pending?.timer) {
      clearTimeout(pending.timer);
      pendingQuantityRef.current.delete(itemId);
    }
    
    setRemovingId(itemId);
    try {
      await removeFromCart(itemId);
    } finally {
      setRemovingId(null);
    }
  }, [removeFromCart]);

  // Cleanup timers on unmount
  useEffect(() => {
    const pendingMap = pendingQuantityRef.current;
    return () => {
      pendingMap.forEach(({ timer }) => clearTimeout(timer));
    };
  }, []);

  // Get first cart item for checkout modal preview
  const firstItem = items[0];
  const checkoutProduct = firstItem ? {
    id: firstItem.productId,
    name: `Cart (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
    price: subtotal,
    imageUrl: firstItem.product.imageUrl || undefined,
  } : null;

  // Calculate unique product count (not total quantity)
  const uniqueProductCount = items.length;

  return (
    <>
      <style jsx>{`
        /* ================================================================
           DESIGN TOKENS - 8pt Grid System
           ================================================================ */
        .cart-page {
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
          --space-5: 20px;
          --space-6: 24px;
          --space-8: 32px;
          --space-10: 40px;
          --space-12: 48px;
          --space-16: 64px;
          
          --text-xs: 12px;
          --text-sm: 14px;
          --text-base: 16px;
          --text-lg: 18px;
          --text-xl: 20px;
          --text-2xl: 24px;
          --text-3xl: 30px;
          
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          
          --color-bg: #fafafa;
          --color-surface: #ffffff;
          --color-border: #e5e7eb;
          --color-border-light: #f3f4f6;
          --color-text: #111827;
          --color-text-secondary: #6b7280;
          --color-text-muted: #9ca3af;
          --color-primary: #be185d;
          --color-primary-light: #fdf2f8;
          --color-success: #059669;
          --color-error: #dc2626;
          
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-bg);
        }
        
        /* ================================================================
           LAYOUT
           ================================================================ */
        .cart-container {
          flex: 1;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: var(--space-6);
        }
        
        .cart-header {
          margin-bottom: var(--space-8);
        }
        
        .cart-back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: 500;
          margin-bottom: var(--space-4);
          transition: color 0.15s ease;
        }
        .cart-back-link:hover {
          color: var(--color-primary);
        }
        
        .cart-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .cart-title svg {
          color: var(--color-text-secondary);
        }
        
        .cart-count {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-left: var(--space-2);
        }
        
        /* ================================================================
           MAIN LAYOUT
           ================================================================ */
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--space-8);
          align-items: start;
        }
        
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* ================================================================
           CART ITEMS
           ================================================================ */
        .cart-items {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        
        .cart-items-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border-light);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        
        .cart-item {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          gap: var(--space-4);
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border-light);
          transition: opacity 0.2s ease;
        }
        .cart-item:last-child {
          border-bottom: none;
        }
        .cart-item.removing {
          opacity: 0.4;
          pointer-events: none;
        }
        
        .item-image {
          width: 100px;
          height: 120px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-border-light);
        }
        .item-image a {
          display: block;
          width: 100%;
          height: 100%;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }
        .item-image a:hover img {
          transform: scale(1.05);
        }
        
        .item-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        
        .item-name {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--color-text);
          text-decoration: none;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
        }
        .item-name:hover {
          color: var(--color-primary);
        }
        
        .item-variant {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }
        
        .variant-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          background: var(--color-border-light);
          padding: 2px var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }
        
        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .item-price {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
          margin-top: auto;
          padding-top: var(--space-2);
        }
        
        .item-unit-price {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          font-weight: normal;
        }
        
        .item-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-3);
        }
        
        .remove-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .remove-btn:hover {
          background: var(--color-error);
          border-color: var(--color-error);
          color: white;
        }
        
        .quantity-control {
          display: flex;
          align-items: center;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }
        
        .qty-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: none;
          cursor: pointer;
          color: var(--color-text);
          transition: background 0.15s ease;
        }
        .qty-btn:hover:not(:disabled) {
          background: var(--color-border-light);
        }
        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .qty-value {
          width: 40px;
          text-align: center;
          font-size: var(--text-sm);
          font-weight: 600;
          border-left: 1px solid var(--color-border);
          border-right: 1px solid var(--color-border);
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-value.updating {
          color: var(--color-text-muted);
        }
        
        .stock-limit {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-align: right;
        }
        .stock-limit.low {
          color: var(--color-primary);
        }
        
        /* ================================================================
           EMPTY STATE
           ================================================================ */
        .cart-empty {
          padding: var(--space-16) var(--space-6);
          text-align: center;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        
        .empty-icon {
          width: 72px;
          height: 72px;
          background: var(--color-border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-5);
          color: var(--color-text-muted);
        }
        
        .empty-title {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-2);
        }
        
        .empty-text {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-6);
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-primary);
          color: white;
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-md);
          text-decoration: none;
          font-weight: 600;
          font-size: var(--text-base);
          transition: background 0.15s ease;
        }
        .empty-cta:hover {
          background: #9d174d;
        }
        
        /* ================================================================
           ORDER SUMMARY
           ================================================================ */
        .cart-summary {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          position: sticky;
          top: 100px;
        }
        
        .summary-header {
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border-light);
        }
        
        .summary-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
        }
        
        .summary-body {
          padding: var(--space-5);
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }
        .summary-row:last-of-type {
          margin-bottom: 0;
        }
        
        .summary-label {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
        }
        
        .summary-value {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--color-text);
        }
        
        .summary-divider {
          height: 1px;
          background: var(--color-border-light);
          margin: var(--space-4) 0;
        }
        
        .summary-total {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-text);
        }
        
        .shipping-note {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-border-light);
          border-radius: var(--radius-md);
          margin-top: var(--space-4);
        }
        .shipping-note svg {
          color: var(--color-text-secondary);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .shipping-note-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        
        .checkout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          background: #FFC2C2;
          color: #1f1f1f;
          padding: var(--space-4);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: 700;
          cursor: pointer;
          margin-top: var(--space-5);
          transition: all 0.15s ease;
        }
        .checkout-btn:hover:not(:disabled) {
          background: #ffb5b5;
          transform: translateY(-1px);
        }
        .checkout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .continue-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: var(--text-sm);
          font-weight: 500;
          margin-top: var(--space-4);
          transition: color 0.15s ease;
        }
        .continue-link:hover {
          color: var(--color-primary);
        }
        
        /* ================================================================
           TRUST BADGES
           ================================================================ */
        .trust-badges {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-5);
          border-top: 1px solid var(--color-border-light);
        }
        
        .trust-badge {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-2);
        }
        
        .badge-icon {
          width: 36px;
          height: 36px;
          background: var(--color-border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
        }
        
        .badge-text {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: 1.3;
        }
        
        /* ================================================================
           LOADING STATE
           ================================================================ */
        .cart-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* ================================================================
           MOBILE
           ================================================================ */
        @media (max-width: 600px) {
          .cart-container {
            padding: var(--space-4);
          }
          
          .cart-title {
            font-size: var(--text-xl);
          }
          
          .cart-item {
            grid-template-columns: 80px 1fr;
            grid-template-rows: auto auto;
          }
          
          .item-image {
            width: 80px;
            height: 100px;
          }
          
          .item-actions {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: space-between;
            padding-top: var(--space-3);
          }
          
          .cart-summary {
            position: static;
          }
          
          .trust-badges {
            flex-direction: column;
            gap: var(--space-3);
          }
          
          .trust-badge {
            flex-direction: row;
            text-align: left;
          }
        }
      `}</style>

      <Header />

      <main className="cart-page">
        <div className="cart-container">
          {/* Header */}
          <header className="cart-header">
            <Link href="/shopping" className="cart-back-link">
              <ArrowLeft size={16} />
              {t('continueShopping')}
            </Link>
            <h1 className="cart-title">
              <ShoppingCart size={24} />
              {t('title')}
              {uniqueProductCount > 0 && (
                <span className="cart-count">
                  ({uniqueProductCount} {uniqueProductCount === 1 ? t('item') : t('items')})
                </span>
              )}
            </h1>
          </header>

          {isLoading ? (
            <div className="cart-loading">
              <div className="loading-spinner" />
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="cart-empty">
              <div className="empty-icon">
                <Package size={32} />
              </div>
              <h2 className="empty-title">{t('emptyTitle')}</h2>
              <p className="empty-text">
                {t('emptyText')}
              </p>
              <Link href="/shopping" className="empty-cta">
                {t('startShopping')}
                <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            /* Cart with Items */
            <div className="cart-layout">
              {/* Cart Items */}
              <section className="cart-items">
                <div className="cart-items-header">
                  {uniqueProductCount} {uniqueProductCount === 1 ? t('product') : t('products')}
                </div>
                
                {items.map((item) => {
                  const displayQuantity = localQuantities.get(item.id) ?? item.quantity;
                  const isAtMaxStock = displayQuantity >= item.stock;
                  const isLowStock = item.stock <= 5;
                  
                  return (
                    <article 
                      key={item.id} 
                      className={`cart-item ${removingId === item.id ? 'removing' : ''}`}
                    >
                      {/* Product Image - Clickable */}
                      <div className="item-image">
                        <Link href={`/product/${item.productId}`}>
                          <img 
                            src={item.product.imageUrl || '/assets/placeholder.png'} 
                            alt={item.product.name}
                          />
                        </Link>
                      </div>
                      
                      {/* Product Details */}
                      <div className="item-details">
                        <Link href={`/product/${item.productId}`} className="item-name">
                          {item.product.name}
                        </Link>
                        
                        <div className="item-variant">
                          {item.variant.size && (
                            <span className="variant-tag">
                              Size: {item.variant.size.label}
                            </span>
                          )}
                          {item.variant.color && (
                            <span className="variant-tag">
                              <span 
                                className="color-dot"
                                style={{ backgroundColor: item.variant.color.hex || '#ccc' }}
                              />
                              {item.variant.color.label}
                            </span>
                          )}
                        </div>
                        
                        <div className="item-price">
                          {formatPrice(item.lineTotal)}
                          {displayQuantity > 1 && (
                            <span className="item-unit-price">
                              {' '}({formatPrice(item.unitPrice)} {t('each')})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="item-actions">
                        <button
                          className="remove-btn"
                          onClick={() => handleRemove(item.id)}
                          disabled={removingId === item.id}
                          aria-label={t('removeItem')}
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="quantity-control">
                          <button
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, displayQuantity - 1, item.stock)}
                            disabled={displayQuantity <= 1 || updatingId === item.id}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`qty-value ${updatingId === item.id ? 'updating' : ''}`}>
                            {updatingId === item.id ? (
                              <Loader2 size={14} className="spin" style={{ animation: 'spin 0.6s linear infinite' }} />
                            ) : (
                              displayQuantity
                            )}
                          </span>
                          <button
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, displayQuantity + 1, item.stock)}
                            disabled={isAtMaxStock || updatingId === item.id}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <span className={`stock-limit ${isLowStock ? 'low' : ''}`}>
                          {isAtMaxStock ? t('maxQuantity') : `${item.stock} ${t('available')}`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* Order Summary */}
              <aside className="cart-summary">
                <div className="summary-header">
                  <h2 className="summary-title">{t('orderSummary')}</h2>
                </div>
                
                <div className="summary-body">
                  <div className="summary-row">
                    <span className="summary-label">{t('subtotal')} ({itemCount} {itemCount === 1 ? t('item') : t('items')})</span>
                    <span className="summary-value">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span className="summary-label">{t('shipping')}</span>
                    <span className="summary-value">{t('calculatedAtCheckout')}</span>
                  </div>
                  
                  <div className="summary-divider" />
                  
                  <div className="summary-row">
                    <span className="summary-label">{t('total')}</span>
                    <span className="summary-total">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="shipping-note">
                    <Truck size={16} />
                    <span className="shipping-note-text">
                      {t('shippingNote')}
                    </span>
                  </div>
                  
                  <button 
                    className="checkout-btn"
                    onClick={() => setShowCheckout(true)}
                    disabled={items.length === 0}
                  >
                    {t('proceedToCheckout')}
                    <ChevronRight size={18} />
                  </button>
                  
                  <Link href="/shopping" className="continue-link">
                    <ArrowLeft size={14} />
                    {t('continueShopping')}
                  </Link>
                </div>
                
                <div className="trust-badges">
                  <div className="trust-badge">
                    <div className="badge-icon">
                      <Shield size={16} />
                    </div>
                    <span className="badge-text">{t('securePayment')}</span>
                  </div>
                  <div className="trust-badge">
                    <div className="badge-icon">
                      <Truck size={16} />
                    </div>
                    <span className="badge-text">{t('fastDelivery')}</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Checkout Modal - Same as Product Page */}
      {checkoutProduct && (
        <ProductCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          product={checkoutProduct}
          quantity={1}
          selectedVariant={null}
          isCartCheckout={true}
          cartItems={items}
        />
      )}
    </>
  );
}
