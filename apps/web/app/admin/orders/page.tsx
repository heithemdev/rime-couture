/**
 * RIME COUTURE - Admin Orders Management Page
 * ============================================
 * Full order management with status updates, filtering, and search
 * Mobile-first responsive design matching client orders UI
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Phone,
  Search,
  Filter,
  RefreshCw,
  X,
  Mail,
  Loader2,
  Edit3,
  Copy,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sizeLabel: string | null;
  colorLabel: string | null;
  colorHex: string | null;
}

interface OrderShipment {
  status: string;
  trackingCode: string | null;
  carrier: string | null;
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
  customerEmail: string;
  addressLine1: string;
  addressLine2?: string;
  wilayaCode?: number;
  wilayaName: string;
  commune: string;
  customerNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
  items: OrderItem[];
  shipment: OrderShipment | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ORDER_STATUSES = [
  { value: 'ALL', label: 'All Orders', color: '#64748b' },
  { value: 'PENDING', label: 'Pending', color: '#f59e0b' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#3b82f6' },
  { value: 'SHIPPING', label: 'Shipping', color: '#06b6d4' },
  { value: 'DELIVERED', label: 'Delivered', color: '#22c55e' },
];

const TRANSLATIONS = {
  en: {
    title: 'Order Management',
    subtitle: 'Manage all customer orders',
    search: 'Search orders...',
    filterByStatus: 'Filter by Status',
    allOrders: 'All Orders',
    orders: 'orders',
    noOrders: 'No orders found',
    noOrdersDesc: 'Try adjusting your filters or search criteria',
    loading: 'Loading orders...',
    refresh: 'Refresh',
    updateStatus: 'Update Status',
    trackingCode: 'Tracking Code',
    carrier: 'Carrier',
    save: 'Save',
    cancel: 'Cancel',
    customer: 'Customer',
    shippingAddress: 'Shipping Address',
    orderItems: 'Order Items',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    note: 'Customer Note',
    copyPhone: 'Copy phone number',
    copied: 'Copied!',
    viewProduct: 'View product',
    status: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      SHIPPING: 'Shipping',
      DELIVERED: 'Delivered',
    },
  },
  ar: {
    title: 'إدارة الطلبات',
    subtitle: 'إدارة جميع طلبات العملاء',
    search: 'البحث عن الطلبات...',
    filterByStatus: 'التصفية حسب الحالة',
    allOrders: 'جميع الطلبات',
    orders: 'طلبات',
    noOrders: 'لا توجد طلبات',
    noOrdersDesc: 'جرب تعديل الفلاتر أو معايير البحث',
    loading: 'جاري تحميل الطلبات...',
    refresh: 'تحديث',
    updateStatus: 'تحديث الحالة',
    trackingCode: 'رمز التتبع',
    carrier: 'الناقل',
    save: 'حفظ',
    cancel: 'إلغاء',
    customer: 'العميل',
    shippingAddress: 'عنوان الشحن',
    orderItems: 'عناصر الطلب',
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    total: 'المجموع',
    note: 'ملاحظة العميل',
    copyPhone: 'نسخ رقم الهاتف',
    copied: 'تم النسخ!',
    viewProduct: 'عرض المنتج',
    status: {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'مؤكد',
      SHIPPING: 'قيد الشحن',
      DELIVERED: 'تم التسليم',
    },
  },
  fr: {
    title: 'Gestion des Commandes',
    subtitle: 'Gérer toutes les commandes clients',
    search: 'Rechercher des commandes...',
    filterByStatus: 'Filtrer par Statut',
    allOrders: 'Toutes les Commandes',
    orders: 'commandes',
    noOrders: 'Aucune commande trouvée',
    noOrdersDesc: 'Essayez d\'ajuster vos filtres ou critères de recherche',
    loading: 'Chargement des commandes...',
    refresh: 'Actualiser',
    updateStatus: 'Mettre à jour le statut',
    trackingCode: 'Code de suivi',
    carrier: 'Transporteur',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    customer: 'Client',
    shippingAddress: 'Adresse de livraison',
    orderItems: 'Articles de la commande',
    orderSummary: 'Résumé de la commande',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    total: 'Total',
    note: 'Note du client',
    copyPhone: 'Copier le numéro',
    copied: 'Copié!',
    viewProduct: 'Voir le produit',
    status: {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmé',
      SHIPPING: 'En livraison',
      DELIVERED: 'Livré',
    },
  },
};

type Lang = keyof typeof TRANSLATIONS;

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
  const statusObj = ORDER_STATUSES.find((s) => s.value === status);
  return statusObj?.color || '#6b7280';
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

export default function AdminOrdersPage() {
  const locale = useLocale();
  const t = TRANSLATIONS[(locale?.toLowerCase() as Lang) || 'en'] || TRANSLATIONS.en;

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch orders
  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle order expansion
  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    setEditingOrderId(null);
  };

  // Start editing order status
  const startEditStatus = (order: Order) => {
    setEditingOrderId(order.id);
    setEditStatus(order.status);
    setEditTrackingCode(order.shipment?.trackingCode || '');
    setEditCarrier(order.shipment?.carrier || '');
  };

  // Save status update
  const saveStatusUpdate = async (orderId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: editStatus,
          ...(editStatus === 'SHIPPING' && {
            trackingCode: editTrackingCode,
            carrier: editCarrier,
          }),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: editStatus } : o
          )
        );
        setEditingOrderId(null);
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy phone number
  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Header />

      <div className="admin-orders-page">
        <style jsx>{styles}</style>

        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <Link href="/admin" className="back-link">
              <ChevronLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="page-title">
              <Package size={28} />
              {t.title}
            </h1>
            <p className="page-subtitle">{t.subtitle}</p>
          </div>

          <button
            className="refresh-btn"
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
            {t.refresh}
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="status-filters" ref={filterDropdownRef}>
            <Filter size={16} />
            <button
              className="custom-dropdown-trigger"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              <span
                className="dropdown-status-dot"
                style={{ backgroundColor: getStatusColor(statusFilter) }}
              />
              {statusFilter === 'ALL'
                ? t.allOrders
                : t.status[statusFilter as keyof typeof t.status] || statusFilter}
              <ChevronDown size={14} className={`dropdown-chevron ${isFilterDropdownOpen ? 'rotated' : ''}`} />
            </button>
            {isFilterDropdownOpen && (
              <div className="custom-dropdown-menu">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    className={`custom-dropdown-item ${statusFilter === status.value ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter(status.value);
                      setCurrentPage(1);
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    <span
                      className="dropdown-status-dot"
                      style={{ backgroundColor: status.color }}
                    />
                    {t.status[status.value as keyof typeof t.status] || status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        {pagination && (
          <div className="results-count">
            {pagination.totalCount} {t.orders}
          </div>
        )}

        {/* Orders list */}
        {isLoading ? (
          <div className="loading-state">
            <Loader2 size={40} className="spin" />
            <p>{t.loading}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => fetchOrders()}>{t.refresh}</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>{t.noOrders}</h3>
            <p>{t.noOrdersDesc}</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${expandedOrderId === order.id ? 'expanded' : ''}`}
              >
                {/* Order Header */}
                <button
                  className="order-header"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="order-header-left">
                    <div className="order-number">#{order.orderNumber}</div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                  </div>

                  <div className="order-header-right">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                      }}
                    >
                      {getStatusIcon(order.status)}
                      {t.status[order.status as keyof typeof t.status] || order.status}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`chevron ${expandedOrderId === order.id ? 'rotated' : ''}`}
                    />
                  </div>
                </button>

                {/* Order Preview (collapsed) */}
                {expandedOrderId !== order.id && (
                  <div className="order-preview">
                    <div className="preview-items">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="preview-thumb">
                          {item.productImageUrl ? (
                            <img src={item.productImageUrl} alt="" />
                          ) : (
                            <Package size={16} />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="preview-more">+{order.items.length - 3}</div>
                      )}
                    </div>
                    <div className="preview-total">{formatPrice(order.total)}</div>
                  </div>
                )}

                {/* Order Details (expanded) */}
                {expandedOrderId === order.id && (
                  <div className="order-details">
                    {/* Status Update Section */}
                    <div className="detail-section">
                      <div className="section-title">
                        <Edit3 size={14} />
                        {t.updateStatus}
                      </div>

                      {editingOrderId === order.id ? (
                        <div className="status-edit">
                          <div className="custom-status-edit-dropdown" ref={statusDropdownRef}>
                            <button
                              className="custom-dropdown-trigger status-trigger"
                              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            >
                              <span
                                className="dropdown-status-dot"
                                style={{ backgroundColor: getStatusColor(editStatus) }}
                              />
                              {t.status[editStatus as keyof typeof t.status] || editStatus}
                              <ChevronDown size={14} className={`dropdown-chevron ${isStatusDropdownOpen ? 'rotated' : ''}`} />
                            </button>
                            {isStatusDropdownOpen && (
                              <div className="custom-dropdown-menu">
                                {ORDER_STATUSES.filter((s) => s.value !== 'ALL').map((status) => (
                                  <button
                                    key={status.value}
                                    className={`custom-dropdown-item ${editStatus === status.value ? 'active' : ''}`}
                                    onClick={() => {
                                      setEditStatus(status.value);
                                      setIsStatusDropdownOpen(false);
                                    }}
                                  >
                                    <span
                                      className="dropdown-status-dot"
                                      style={{ backgroundColor: status.color }}
                                    />
                                    {t.status[status.value as keyof typeof t.status] || status.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {editStatus === 'SHIPPING' && (
                            <div className="shipping-inputs">
                              <input
                                type="text"
                                placeholder={t.trackingCode}
                                value={editTrackingCode}
                                onChange={(e) => setEditTrackingCode(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder={t.carrier}
                                value={editCarrier}
                                onChange={(e) => setEditCarrier(e.target.value)}
                              />
                            </div>
                          )}

                          <div className="edit-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => saveStatusUpdate(order.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? <Loader2 size={16} className="spin" /> : t.save}
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => setEditingOrderId(null)}
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="edit-status-btn"
                          onClick={() => startEditStatus(order)}
                        >
                          <span
                            className="current-status"
                            style={{
                              backgroundColor: `${getStatusColor(order.status)}20`,
                              color: getStatusColor(order.status),
                            }}
                          >
                            {getStatusIcon(order.status)}
                            {t.status[order.status as keyof typeof t.status] || order.status}
                          </span>
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="detail-section">
                      <div className="section-title">
                        <User size={14} />
                        {t.customer}
                      </div>
                      <div className="customer-info">
                        <div className="customer-name">{order.customerName}</div>
                        <div className="customer-contact">
                          <a href={`tel:${order.customerPhone}`} className="contact-link">
                            <Phone size={14} />
                            {order.customerPhone}
                          </a>
                          <button
                            className="copy-btn"
                            onClick={() => copyPhone(order.customerPhone)}
                          >
                            {copiedPhone === order.customerPhone ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        {order.customerEmail && (
                          <a href={`mailto:${order.customerEmail}`} className="contact-link">
                            <Mail size={14} />
                            {order.customerEmail}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="detail-section">
                      <div className="section-title">
                        <MapPin size={14} />
                        {t.shippingAddress}
                      </div>
                      <div className="address-info">
                        <div>{order.addressLine1}</div>
                        {order.addressLine2 && <div>{order.addressLine2}</div>}
                        <div>
                          {order.commune}, {order.wilayaName}
                          {order.wilayaCode && ` (${order.wilayaCode})`}
                        </div>
                      </div>
                    </div>

                    {/* Customer Note */}
                    {order.customerNote && (
                      <div className="detail-section">
                        <div className="section-title">
                          <AlertCircle size={14} />
                          {t.note}
                        </div>
                        <div className="customer-note">{order.customerNote}</div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="detail-section">
                      <div className="section-title">
                        <Package size={14} />
                        {t.orderItems}
                      </div>
                      <div className="order-items">
                        {order.items.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="item-image">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt="" />
                              ) : (
                                <Package size={24} />
                              )}
                            </div>
                            <div className="item-details">
                              <div className="item-name">{item.productName}</div>
                              <div className="item-variant">
                                {item.sizeLabel && <span>Size: {item.sizeLabel}</span>}
                                {item.colorLabel && (
                                  <span>
                                    {item.colorHex && (
                                      <span
                                        className="color-dot"
                                        style={{ backgroundColor: item.colorHex }}
                                      />
                                    )}
                                    {item.colorLabel}
                                  </span>
                                )}
                              </div>
                              <div className="item-pricing">
                                <span className="item-qty">x{item.quantity}</span>
                                <span className="item-price">{formatPrice(item.lineTotal)}</span>
                              </div>
                            </div>
                            <Link
                              href={`/product/${item.productSlug || item.productId}`}
                              className="view-product"
                              target="_blank"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="detail-section summary">
                      <div className="section-title">{t.orderSummary}</div>
                      <div className="summary-rows">
                        <div className="summary-row">
                          <span>{t.subtotal}</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="summary-row">
                          <span>{t.shipping}</span>
                          <span>{formatPrice(order.shipping)}</span>
                        </div>
                        <div className="summary-row total">
                          <span>{t.total}</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span>
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = `
  .admin-orders-page {
    min-height: 100vh;
    background: #fafafa;
    padding: 24px;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    transition: color 0.2s;
  }
  .back-link:hover {
    color: #be185d;
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px;
  }
  .page-title svg {
    color: #be185d;
  }

  .page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .refresh-btn:hover:not(:disabled) {
    border-color: #be185d;
    color: #be185d;
  }
  .refresh-btn:disabled {
    opacity: 0.6;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .filters-section {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    transition: border-color 0.2s;
  }
  .search-box:focus-within {
    border-color: #be185d;
  }
  .search-box input {
    flex: 1;
    padding: 14px 0;
    border: none;
    font-size: 14px;
    background: transparent;
  }
  .search-box input:focus {
    outline: none;
  }
  .search-box svg {
    color: #94a3b8;
  }
  .clear-search {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .clear-search:hover {
    color: #be185d;
  }

  .status-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    position: relative;
  }
  .status-filters svg {
    color: #94a3b8;
  }

  .custom-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 8px;
    border: none;
    font-size: 14px;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    color: #0f172a;
  }
  .custom-dropdown-trigger:focus {
    outline: none;
  }
  .custom-dropdown-trigger .dropdown-chevron {
    color: #94a3b8;
    transition: transform 0.2s;
  }
  .custom-dropdown-trigger .dropdown-chevron.rotated {
    transform: rotate(180deg);
  }

  .dropdown-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .custom-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    min-width: 200px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 100;
    margin-top: 4px;
    overflow: hidden;
    animation: dropdownFadeIn 0.15s ease-out;
  }

  @keyframes dropdownFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .custom-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    color: #334155;
    transition: all 0.15s;
    text-align: left;
  }
  .custom-dropdown-item:hover {
    background: #f8fafc;
    color: #be185d;
  }
  .custom-dropdown-item.active {
    background: #fdf2f8;
    color: #be185d;
    font-weight: 600;
  }
  .custom-dropdown-item + .custom-dropdown-item {
    border-top: 1px solid #f1f5f9;
  }

  .custom-status-edit-dropdown {
    position: relative;
  }
  .custom-status-edit-dropdown .custom-dropdown-trigger.status-trigger {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    justify-content: space-between;
  }
  .custom-status-edit-dropdown .custom-dropdown-trigger.status-trigger:hover {
    border-color: #be185d;
  }
  .custom-status-edit-dropdown .custom-dropdown-menu {
    left: 0;
    right: 0;
  }

  .results-count {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 16px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    text-align: center;
    color: #64748b;
  }
  .loading-state svg,
  .error-state svg,
  .empty-state svg {
    margin-bottom: 16px;
    color: #94a3b8;
  }
  .empty-state h3 {
    font-size: 20px;
    color: #0f172a;
    margin: 0 0 8px;
  }
  .error-state button,
  .empty-state button {
    margin-top: 16px;
    padding: 12px 24px;
    background: #be185d;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .order-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    transition: all 0.2s;
  }
  .order-card:hover {
    border-color: #cbd5e1;
  }
  .order-card.expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #be185d;
  }

  .order-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 16px 20px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: background 0.2s;
  }
  .order-header:hover {
    background: #f8fafc;
  }

  .order-header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .order-number {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .order-date {
    font-size: 13px;
    color: #64748b;
  }

  .order-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .chevron {
    color: #64748b;
    transition: transform 0.3s;
  }
  .chevron.rotated {
    transform: rotate(180deg);
  }

  .order-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid #f1f5f9;
  }

  .preview-items {
    display: flex;
    gap: 8px;
  }

  .preview-thumb {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
  }
  .preview-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-more {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .preview-total {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  .order-details {
    padding: 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .detail-section {
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .detail-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #2dafaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  .status-edit {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .shipping-inputs {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .shipping-inputs input {
    flex: 1;
    min-width: 150px;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
  }
  .shipping-inputs input:focus {
    outline: none;
    border-color: #be185d;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary {
    background: #be185d;
    color: white;
    border: none;
  }
  .btn-primary:hover:not(:disabled) {
    background: #9d174d;
  }
  .btn-outline {
    background: white;
    color: #64748b;
    border: 2px solid #e2e8f0;
  }
  .btn-outline:hover {
    border-color: #be185d;
    color: #be185d;
  }
  .btn:disabled {
    opacity: 0.6;
  }

  .edit-status-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .edit-status-btn:hover {
    border-color: #be185d;
    background: #fdf2f8;
  }

  .current-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .customer-name {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  .customer-contact {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .contact-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #64748b;
    text-decoration: none;
  }
  .contact-link:hover {
    color: #be185d;
  }

  .copy-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .copy-btn:hover {
    color: #be185d;
  }

  .address-info {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
  }

  .customer-note {
    font-size: 14px;
    color: #475569;
    font-style: italic;
    padding: 12px;
    background: #fef3c7;
    border-radius: 6px;
  }

  .order-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    align-items: center;
  }

  .item-image {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
  }
  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-details {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-variant {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
  }

  .color-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-right: 4px;
    vertical-align: middle;
  }

  .item-pricing {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .item-qty {
    font-size: 13px;
    color: #64748b;
  }

  .item-price {
    font-size: 14px;
    font-weight: 700;
    color: #be185d;
  }

  .view-product {
    padding: 8px;
    color: #94a3b8;
    transition: color 0.2s;
  }
  .view-product:hover {
    color: #be185d;
  }

  .detail-section.summary {
    background: #f0fdfa;
    border: 2px solid #2dafaa;
  }

  .summary-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #64748b;
  }

  .summary-row.total {
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid #2dafaa;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
  }
  .pagination button {
    padding: 12px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .pagination button:hover:not(:disabled) {
    border-color: #be185d;
    color: #be185d;
  }
  .pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pagination span {
    font-size: 14px;
    color: #64748b;
  }

  @media (min-width: 1024px) {
    .admin-orders-page {
      padding: 32px 56px;
    }
    
    .order-header {
      padding: 20px 32px;
    }

    .order-preview {
      padding: 16px 32px;
    }

    .order-details {
      padding: 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .detail-section {
      margin-bottom: 0;
    }

    .detail-section.summary {
      grid-column: 1 / -1;
    }

    .page-title {
      font-size: 32px;
    }

    .order-card {
      border-radius: 16px;
    }
  }

  @media (min-width: 1440px) {
    .admin-orders-page {
      padding: 40px 80px;
    }
  }

  @media (max-width: 768px) {
    .admin-orders-page {
      padding: 16px;
    }

    .page-header {
      flex-direction: column;
    }

    .page-title {
      font-size: 24px;
    }

    .filters-section {
      flex-direction: column;
    }

    .search-box {
      min-width: 100%;
    }

    .order-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .order-header-right {
      width: 100%;
      justify-content: space-between;
    }

    .order-preview {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .shipping-inputs {
      flex-direction: column;
    }

    .order-item {
      flex-wrap: wrap;
    }

    .item-details {
      order: 1;
      width: calc(100% - 76px);
    }

    .view-product {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }

  @media (max-width: 480px) {
    .status-badge {
      padding: 4px 8px;
      font-size: 11px;
    }

    .preview-thumb {
      width: 32px;
      height: 32px;
    }

    .item-image {
      width: 48px;
      height: 48px;
    }
  }
`;
