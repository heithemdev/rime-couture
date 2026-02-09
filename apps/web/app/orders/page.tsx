/**
 * Orders Page
 * Displays user's order history with status tracking
 * Requires authentication to view orders
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  User,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  AlertCircle,
  Phone,
  LogIn,
} from 'lucide-react';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { useFingerprint } from '@/lib/cart-context';

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sizeLabel: string | null;
  colorLabel: string | null;
}

interface OrderShipment {
  status: string;
  trackingCode: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  wilayaName: string;
  commune: string;
  customerNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  shipment: OrderShipment | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    SHIPPING: '#06b6d4',
    DELIVERED: '#22c55e',
  };
  return colors[status] || '#6b7280';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock size={16} />;
    case 'CONFIRMED':
      return <CheckCircle2 size={16} />;
    case 'SHIPPING':
      return <Truck size={16} />;
    case 'DELIVERED':
      return <CheckCircle2 size={16} />;
    default:
      return <Clock size={16} />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function OrdersPage() {
  const fingerprint = useFingerprint();
  const t = useTranslations('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setIsAuthenticated(!!data.user))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Get translated status label
  const getTranslatedStatus = (status: string) => {
    return t(`status_${status}`) || status;
  };

  // Toggle order expansion
  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!fingerprint) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/orders?fingerprint=${fingerprint}`);
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint]);

  useEffect(() => {
    if (fingerprint) {
      fetchOrders();
    }
  }, [fingerprint, fetchOrders]);

  return (
    <>
      <style jsx>{`
        /* ================================================================
           DESIGN TOKENS - 8pt Grid System
           ================================================================ */
        .orders-page {
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
          --radius-xl: 16px;
          
          --color-bg: #fafafa;
          --color-surface: #ffffff;
          --color-border: #e5e7eb;
          --color-border-light: #f3f4f6;
          --color-text: #111827;
          --color-text-secondary: #6b7280;
          --color-text-muted: #9ca3af;
          --color-primary: #be185d;
          --color-primary-light: #fdf2f8;
          --color-secondary: #2dafaa;
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
        .orders-container {
          flex: 1;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: var(--space-6);
        }
        
        .orders-header {
          margin-bottom: var(--space-8);
        }
        
        .back-link {
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
        .back-link:hover {
          color: var(--color-primary);
        }
        
        .page-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .page-title svg {
          color: var(--color-primary);
        }
        
        /* ================================================================
           LOADING & EMPTY STATES
           ================================================================ */
        .loading-state,
        .empty-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16) var(--space-6);
          text-align: center;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .state-icon {
          width: 72px;
          height: 72px;
          background: var(--color-border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-5);
          color: var(--color-text-muted);
        }
        
        .state-title {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-2);
        }
        
        .state-text {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-6);
          max-width: 360px;
        }
        
        .state-cta {
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
          transition: all 0.15s ease;
        }
        .state-cta:hover {
          background: #9d174d;
          transform: translateY(-1px);
        }
        
        /* ================================================================
           ORDERS LIST
           ================================================================ */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        
        .order-card {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .order-card:hover {
          border-color: var(--color-primary);
        }
        .order-card.expanded {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background 0.15s ease;
        }
        .order-card-header:hover {
          background: var(--color-border-light);
        }
        
        .order-header-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        .order-header-right {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        
        .chevron-icon {
          color: var(--color-text-secondary);
          transition: transform 0.3s ease;
        }
        .chevron-icon.rotated {
          transform: rotate(180deg);
        }
        
        .order-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        
        .order-number {
          font-weight: 700;
          font-size: var(--text-base);
          color: var(--color-text);
        }
        
        .order-date {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .order-status {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: 600;
        }
        
        /* Preview Section (visible when collapsed) */
        .order-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-5);
          border-top: 1px solid var(--color-border-light);
        }

        .order-items-preview {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
        }
        
        .order-item-thumb {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--color-border-light);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }
        .order-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .order-item-more {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--color-border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .order-item-count {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .order-total {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
        }
        
        /* Expanded Details Section */
        .order-details {
          padding: var(--space-5);
          border-top: 1px solid var(--color-border);
          background: var(--color-border-light);
          animation: expandIn 0.3s ease;
        }
        @keyframes expandIn {
          from { 
            opacity: 0;
            max-height: 0;
          }
          to { 
            opacity: 1;
            max-height: 2000px;
          }
        }
        
        .detail-section {
          margin-bottom: var(--space-5);
          background: var(--color-surface);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        .detail-section:last-child {
          margin-bottom: 0;
        }
        
        .detail-section-title {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--space-3);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .detail-card {
          background: var(--color-border-light);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--space-2) 0;
          border-bottom: 1px solid var(--color-border);
        }
        .detail-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .detail-row:first-child {
          padding-top: 0;
        }
        
        .detail-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .detail-value {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text);
          text-align: right;
          max-width: 60%;
        }
        
        /* Order Items in Modal */
        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        
        .order-item {
          display: flex;
          gap: var(--space-3);
          background: var(--color-border-light);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }
        
        .item-image {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface);
          flex-shrink: 0;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
        }
        
        .item-details {
          flex: 1;
          min-width: 0;
        }
        
        .item-name {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--space-1);
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .item-variant {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-2);
        }
        
        .item-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .item-qty {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }
        
        .item-total {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-primary);
        }
        
        /* Pricing Summary */
        .pricing-summary {
          background: var(--color-surface);
          border-radius: var(--radius-md);
          border: 2px solid var(--color-border);
          padding: var(--space-4);
        }
        
        .pricing-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-2);
        }
        .pricing-row:last-child {
          margin-bottom: 0;
        }
        
        .pricing-row.total {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
          padding-top: var(--space-3);
          margin-top: var(--space-3);
          border-top: 2px solid var(--color-border);
        }
        
        /* Status Timeline */
        .status-timeline {
          display: flex;
          gap: var(--space-2);
          padding: var(--space-4);
          background: var(--color-border-light);
          border-radius: var(--radius-md);
          overflow-x: auto;
        }
        
        .timeline-step {
          flex: 1;
          min-width: 80px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        
        .timeline-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          color: var(--color-text-muted);
        }
        .timeline-icon.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .timeline-icon.completed {
          background: var(--color-success);
          border-color: var(--color-success);
          color: white;
        }
        
        .timeline-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }
        
        /* ================================================================
           RESPONSIVE
           ================================================================ */
        @media (max-width: 640px) {
          .orders-container {
            padding: var(--space-4);
          }
          
          .page-title {
            font-size: var(--text-xl);
          }
          
          .order-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .modal-content {
            margin: var(--space-4);
          }
          
          .modal-body {
            padding: var(--space-4);
          }
          
          .status-timeline {
            flex-direction: column;
          }
          
          .timeline-step {
            flex-direction: row;
            text-align: left;
            min-width: 100%;
          }
        }
      `}</style>

      <Header />

      <main className="orders-page">
        <div className="orders-container">
          {/* Header */}
          <header className="orders-header">
            <Link href="/shopping" className="back-link">
              <ArrowLeft size={16} />
              {t('startShopping')}
            </Link>
            <h1 className="page-title">
              <Package size={24} />
              {t('title')}
            </h1>
          </header>

          {/* Content */}
          {isAuthenticated === false ? (
            <div className="empty-state">
              <div className="state-icon" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(255,179,71,0.1))' }}>
                <LogIn size={32} style={{ color: '#FF6B9D' }} />
              </div>
              <h2 className="state-title">{t('signInRequired')}</h2>
              <p className="state-text">{t('signInToTrack')}</p>
              <button
                className="state-cta"
                onClick={() => {
                  // Trigger header auth modal via custom event
                  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
                }}
              >
                <LogIn size={18} />
                {t('signInBtn')}
              </button>
            </div>
          ) : isAuthenticated === null || isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="state-icon">
                <AlertCircle size={32} />
              </div>
              <h2 className="state-title">Something went wrong</h2>
              <p className="state-text">{error}</p>
              <button className="state-cta" onClick={fetchOrders}>
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="state-icon">
                <ShoppingBag size={32} />
              </div>
              <h2 className="state-title">{t('noOrdersYet')}</h2>
              <p className="state-text">{t('noOrdersDescription')}</p>
              <Link href="/shopping" className="state-cta">
                {t('startShopping')}
                <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <article key={order.id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                    {/* Clickable Header */}
                    <button
                      className="order-card-header"
                      onClick={() => toggleOrder(order.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="order-header-left">
                        <div className="order-info">
                          <span className="order-number">{order.orderNumber}</span>
                          <span className="order-date">{formatDate(order.createdAt)}</span>
                        </div>
                        <span
                          className="order-status"
                          style={{
                            backgroundColor: `${getStatusColor(order.status)}15`,
                            color: getStatusColor(order.status),
                          }}
                        >
                          {getStatusIcon(order.status)}
                          {getTranslatedStatus(order.status)}
                        </span>
                      </div>
                      <div className="order-header-right">
                        <span className="order-total">{formatPrice(order.total)}</span>
                        <ChevronDown 
                          size={20} 
                          className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
                        />
                      </div>
                    </button>
                    
                    {/* Preview (visible when collapsed) */}
                    {!isExpanded && (
                      <div className="order-preview">
                        <div className="order-items-preview">
                          {order.items.slice(0, 4).map((item) => (
                            <div key={item.id} className="order-item-thumb">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt={item.productName} />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="order-item-more">+{order.items.length - 4}</div>
                          )}
                        </div>
                        <span className="order-item-count">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} {t('items')}
                        </span>
                      </div>
                    )}
                    
                    {/* Expanded Details (visible when expanded) */}
                    {isExpanded && (
                      <div className="order-details">
                        {/* Status Timeline */}
                        <div className="detail-section">
                          <h3 className="detail-section-title">
                            <Truck size={14} />
                            {t('orderStatus')}
                          </h3>
                          <div className="status-timeline">
                            {['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'].map(
                              (status, index) => {
                                const statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
                                const currentIndex = statusOrder.indexOf(order.status);
                                const isCompleted = index < currentIndex;
                                const isActive = index === currentIndex;
                                
                                return (
                                  <div key={status} className="timeline-step">
                                    <div
                                      className={`timeline-icon ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 size={18} />
                                      ) : (
                                        getStatusIcon(status)
                                      )}
                                    </div>
                                    <span className="timeline-label">{getTranslatedStatus(status)}</span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                        
                        {/* Customer Info */}
                        <div className="detail-section">
                          <h3 className="detail-section-title">
                            <User size={14} />
                            {t('customerInfo')}
                          </h3>
                          <div className="detail-card">
                            <div className="detail-row">
                              <span className="detail-label">{t('name')}</span>
                              <span className="detail-value">{order.customerName}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">
                                <Phone size={12} />
                                {t('phone')}
                              </span>
                              <span className="detail-value">{order.customerPhone}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delivery Address */}
                        <div className="detail-section">
                          <h3 className="detail-section-title">
                            <MapPin size={14} />
                            {t('deliveryAddress')}
                          </h3>
                          <div className="detail-card">
                            <div className="detail-row">
                              <span className="detail-label">{t('address')}</span>
                              <span className="detail-value">{order.addressLine1}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">{t('wilaya')}</span>
                              <span className="detail-value">{order.wilayaName}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">{t('commune')}</span>
                              <span className="detail-value">{order.commune}</span>
                            </div>
                            {order.customerNote && (
                              <div className="detail-row">
                                <span className="detail-label">{t('notes')}</span>
                                <span className="detail-value">{order.customerNote}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="detail-section">
                          <h3 className="detail-section-title">
                            <Package size={14} />
                            {t('orderItems')}
                          </h3>
                          <div className="order-items-list">
                            {order.items.map((item) => (
                              <div key={item.id} className="order-item">
                                <div className="item-image">
                                  {item.productImageUrl ? (
                                    <img src={item.productImageUrl} alt={item.productName} />
                                  ) : (
                                    <div className="item-image-placeholder">
                                      <Package size={24} color="#9ca3af" />
                                    </div>
                                  )}
                                </div>
                                <div className="item-details">
                                  <div className="item-name">{item.productName}</div>
                                  {(item.sizeLabel || item.colorLabel) && (
                                    <div className="item-variant">
                                      {item.sizeLabel && `${t('size')}: ${item.sizeLabel}`}
                                      {item.sizeLabel && item.colorLabel && ' • '}
                                      {item.colorLabel && `${t('color')}: ${item.colorLabel}`}
                                    </div>
                                  )}
                                  <div className="item-price-row">
                                    <span className="item-qty">
                                      {formatPrice(item.unitPrice)} × {item.quantity}
                                    </span>
                                    <span className="item-total">{formatPrice(item.lineTotal)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Pricing Summary */}
                        <div className="detail-section">
                          <div className="pricing-summary">
                            <div className="pricing-row">
                              <span>{t('subtotal')}</span>
                              <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="pricing-row">
                              <span>{t('shipping')}</span>
                              <span>{formatPrice(order.shipping)}</span>
                            </div>
                            <div className="pricing-row total">
                              <span>{t('total')}</span>
                              <span>{formatPrice(order.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
