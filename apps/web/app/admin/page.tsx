//apps/web/app/admin/page.tsx
/**
 * RIME COUTURE - Admin Analytics Dashboard
 * =========================================
 * Premium analytics dashboard with i18n support
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/cache';

// ============================================================================
// DESIGN TOKENS (8pt Grid System)
// ============================================================================

const TOKENS = {
  spacing: {
    1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
    6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px',
  },
  fontSize: {
    xs: '12px', sm: '14px', base: '16px', lg: '18px',
    xl: '20px', '2xl': '24px', '3xl': '30px', '4xl': '36px',
  },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  radius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
  colors: {
    primary: '#be185d', primaryLight: '#fdf2f8',
    secondary: '#2dafaa', secondaryLight: '#f0fdfa',
    accent: '#f59e0b', accentLight: '#fffbeb',
    success: '#059669', successLight: '#ecfdf5',
    warning: '#d97706', warningLight: '#fffbeb',
    error: '#dc2626', errorLight: '#fef2f2',
    bg: '#f8fafc', surface: '#ffffff',
    border: '#e2e8f0', borderLight: '#f1f5f9',
    text: '#0f172a', textSecondary: '#64748b', textMuted: '#94a3b8',
  },
} as const;

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalProducts: number;
  totalClicks: number;
}

interface MonthlyData {
  month: string;
  year: number;
  orders?: number;
  revenue?: number;
}

interface WilayaData {
  code: number;
  name: string;
  orders: number;
  revenue: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  salesCount?: number;
  clicks?: number;
  revenue?: number;
  imageUrl: string | null;
  isActive?: boolean;
  basePriceMinor?: number;
  category?: string;
}

interface CategoryData {
  name: string;
  revenue: number;
  unitsSold: number;
}

interface DashboardData {
  summary: SummaryStats;
  ordersPerMonth: MonthlyData[];
  revenuePerMonth: MonthlyData[];
  ordersByWilaya: WilayaData[];
  topSellingProducts: ProductData[];
  mostClickedProducts: ProductData[];
  categoryPerformance: CategoryData[];
  statusBreakdown: Record<string, number>;
  allProducts?: ProductData[];
}

// ============================================================================
// I18N TRANSLATIONS
// ============================================================================

const translations = {
  en: {
    dashboard: 'Admin Dashboard',
    subtitle: 'Operations Overview',
    totalRevenue: 'Total Revenue',
    totalOrders: 'Total Orders',
    avgOrderValue: 'Avg. Order Value',
    productViews: 'Product Views',
    revenueTrend: 'Revenue Trend',
    ordersPerMonth: 'Orders per Month',
    ordersByWilaya: 'Orders by Wilaya',
    categoryPerformance: 'Category Revenue',
    topSelling: 'Top Selling Products',
    mostViewed: 'Most Viewed Products',
    orderStatus: 'Order Status Distribution',
    noData: 'No data available',
    noSalesYet: 'No sales data yet',
    noViewsYet: 'No view data yet',
    tryAgain: 'Try Again',
    loading: 'Loading dashboard data...',
    error: 'Unable to connect to analytics server. Please try again.',
    last3Months: 'Last 3 months',
    last6Months: 'Last 6 months',
    last12Months: 'Last 12 months',
    allProducts: 'All Products',
    addProduct: 'Add Product',
    hide: 'Hide',
    show: 'Show',
    edit: 'Edit',
    hidden: 'Hidden',
    active: 'Active',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    actions: 'Actions',
    productName: 'Product Name',
    searchProducts: 'Search products...',
    sold: 'sold',
    views: 'views',
    revenue: 'revenue',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to permanently delete this product?',
    deleteSuccess: 'Product deleted successfully',
    deleting: 'Deleting...',
    logout: 'Logout',
  },
  ar: {
    dashboard: 'لوحة تحكم المسؤول',
    subtitle: 'نظرة عامة على العمليات',
    totalRevenue: 'إجمالي الإيرادات',
    totalOrders: 'إجمالي الطلبات',
    avgOrderValue: 'متوسط قيمة الطلب',
    productViews: 'مشاهدات المنتجات',
    revenueTrend: 'اتجاه الإيرادات',
    ordersPerMonth: 'الطلبات شهرياً',
    ordersByWilaya: 'الطلبات حسب الولاية',
    categoryPerformance: 'إيرادات الفئات',
    topSelling: 'المنتجات الأكثر مبيعاً',
    mostViewed: 'المنتجات الأكثر مشاهدة',
    orderStatus: 'توزيع حالة الطلبات',
    noData: 'لا توجد بيانات',
    noSalesYet: 'لا توجد بيانات مبيعات بعد',
    noViewsYet: 'لا توجد بيانات مشاهدات بعد',
    tryAgain: 'حاول مجدداً',
    loading: 'جاري تحميل البيانات...',
    error: 'تعذر الاتصال بالخادم. يرجى المحاولة مجدداً.',
    last3Months: 'آخر 3 أشهر',
    last6Months: 'آخر 6 أشهر',
    last12Months: 'آخر 12 شهر',
    allProducts: 'جميع المنتجات',
    addProduct: 'إضافة منتج',
    hide: 'إخفاء',
    show: 'إظهار',
    edit: 'تعديل',
    hidden: 'مخفي',
    active: 'نشط',
    price: 'السعر',
    stock: 'المخزون',
    category: 'الفئة',
    actions: 'الإجراءات',
    productName: 'اسم المنتج',
    searchProducts: 'البحث عن المنتجات...',
    sold: 'مباع',
    views: 'مشاهدات',
    revenue: 'الإيرادات',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد أنك تريد حذف هذا المنتج نهائياً؟',
    deleteSuccess: 'تم حذف المنتج بنجاح',
    deleting: 'جاري الحذف...',
    logout: 'تسجيل الخروج',
  },
  fr: {
    dashboard: 'Tableau de Bord Admin',
    subtitle: 'Aperçu des Opérations',
    totalRevenue: 'Revenu Total',
    totalOrders: 'Total Commandes',
    avgOrderValue: 'Valeur Moyenne',
    productViews: 'Vues Produits',
    revenueTrend: 'Tendance des Revenus',
    ordersPerMonth: 'Commandes par Mois',
    ordersByWilaya: 'Commandes par Wilaya',
    categoryPerformance: 'Revenus par Catégorie',
    topSelling: 'Produits les Plus Vendus',
    mostViewed: 'Produits les Plus Vus',
    orderStatus: 'Distribution des Statuts',
    noData: 'Aucune donnée disponible',
    noSalesYet: 'Pas encore de ventes',
    noViewsYet: 'Pas encore de vues',
    tryAgain: 'Réessayer',
    loading: 'Chargement des données...',
    error: 'Impossible de se connecter au serveur. Veuillez réessayer.',
    last3Months: '3 derniers mois',
    last6Months: '6 derniers mois',
    last12Months: '12 derniers mois',
    allProducts: 'Tous les Produits',
    addProduct: 'Ajouter Produit',
    hide: 'Masquer',
    show: 'Afficher',
    edit: 'Modifier',
    hidden: 'Masqué',
    active: 'Actif',
    price: 'Prix',
    stock: 'Stock',
    category: 'Catégorie',
    actions: 'Actions',
    productName: 'Nom du Produit',
    searchProducts: 'Rechercher des produits...',
    sold: 'vendu',
    views: 'vues',
    revenue: 'revenus',
    delete: 'Supprimer',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer définitivement ce produit ?',
    deleteSuccess: 'Produit supprimé avec succès',
    deleting: 'Suppression...',
    logout: 'Déconnexion',
  },
};

type Lang = keyof typeof translations;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

function formatCompactNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return Math.round(num).toLocaleString('fr-DZ');
}

function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const Icons = {
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  TrendingDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  DollarSign: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  ShoppingCart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Package: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Eye: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Activity: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ============================================================================
// IMPROVED CHART COMPONENTS
// ============================================================================

/**
 * Improved Line Chart with Y-axis scale and better mobile view
 */
function LineChartImproved({ 
  data, 
  dataKey, 
  color = TOKENS.colors.primary,
  height = 280,
}: { 
  data: MonthlyData[]; 
  dataKey: 'orders' | 'revenue'; 
  color?: string;
  height?: number;
}) {
  const [visibleStart, setVisibleStart] = useState(Math.max(0, data.length - 6));
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const visibleData = data.slice(visibleStart, visibleStart + 6);
  
  const values = visibleData.map(d => d[dataKey] || 0);
  const allValues = data.map(d => d[dataKey] || 0);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  
  // Generate nice Y-axis ticks
  const yTicks = useMemo(() => {
    const range = maxValue - minValue;
    const step = Math.ceil(range / 4);
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(minValue + step * i));
    }
    return ticks.reverse();
  }, [maxValue, minValue]);
  
  const chartPadding = { top: 20, right: 20, bottom: 50, left: 70 };
  const chartHeight = height - chartPadding.top - chartPadding.bottom;
  const chartWidth = 600;
  
  const points = values.map((value, index) => {
    const x = chartPadding.left + (index / Math.max(values.length - 1, 1)) * (chartWidth - chartPadding.left - chartPadding.right);
    const y = chartPadding.top + ((maxValue - value) / (maxValue - minValue || 1)) * chartHeight;
    return { x, y, value };
  });
  
  const linePath = points.length > 0 ? points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1]!;
    const cpX = (prev.x + point.x) / 2;
    return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, '') : '';

  const canGoBack = visibleStart > 0;
  const canGoForward = visibleStart + 6 < data.length;

  return (
    <div style={{ width: '100%' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TOKENS.spacing[3] }}>
        <span style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary }}>
          {visibleData[0]?.month} {visibleData[0]?.year} - {visibleData[visibleData.length - 1]?.month} {visibleData[visibleData.length - 1]?.year}
        </span>
        <div style={{ display: 'flex', gap: TOKENS.spacing[2] }}>
          <button
            onClick={() => setVisibleStart(Math.max(0, visibleStart - 6))}
            disabled={!canGoBack}
            style={{
              padding: TOKENS.spacing[2],
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius.md,
              background: TOKENS.colors.surface,
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              opacity: canGoBack ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icons.ChevronLeft />
          </button>
          <button
            onClick={() => setVisibleStart(Math.min(data.length - 6, visibleStart + 6))}
            disabled={!canGoForward}
            style={{
              padding: TOKENS.spacing[2],
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius.md,
              background: TOKENS.colors.surface,
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              opacity: canGoForward ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icons.ChevronRight />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
          {/* Y-axis labels */}
          {yTicks.map((tick, i) => {
            const y = chartPadding.top + (i / (yTicks.length - 1)) * chartHeight;
            return (
              <g key={i}>
                <line x1={chartPadding.left - 8} y1={y} x2={chartWidth - chartPadding.right} y2={y} stroke={TOKENS.colors.borderLight} strokeWidth="0.5" />
                <text x={chartPadding.left - 12} y={y + 4} textAnchor="end" fontSize="11" fill={TOKENS.colors.textMuted}>
                  {dataKey === 'revenue' ? formatCompactNumber(tick) : tick}
                </text>
              </g>
            );
          })}
          
          {/* Area */}
          {points.length > 0 && (
            <path
              d={`${linePath} L ${points[points.length - 1]!.x} ${chartPadding.top + chartHeight} L ${points[0]!.x} ${chartPadding.top + chartHeight} Z`}
              fill={color}
              fillOpacity="0.1"
            />
          )}
          
          {/* Line */}
          {linePath && (
            <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
          
          {/* Points with hover interaction */}
          {points.map((point, index) => {
            const isHovered = hoveredPoint === index;
            return (
              <g key={index}>
                {/* Larger invisible circle for easier hover target */}
                <circle
                  cx={point.x} cy={point.y} r="20" fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible point */}
                <circle
                  cx={point.x} cy={point.y}
                  r={isHovered ? 8 : 6}
                  fill={isHovered ? color : TOKENS.colors.surface}
                  stroke={color} strokeWidth="3"
                  style={{ transition: 'r 0.15s, fill 0.15s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Hover tooltip (rendered last so it's on top) */}
          {hoveredPoint !== null && points[hoveredPoint] && (() => {
            const point = points[hoveredPoint]!;
            const label = dataKey === 'revenue'
              ? `${point.value.toLocaleString()} DZD`
              : `${point.value} orders`;
            const monthLabel = `${visibleData[hoveredPoint]?.month} ${visibleData[hoveredPoint]?.year}`;
            const textWidth = Math.max(label.length, monthLabel.length) * 7.5 + 24;
            const tooltipX = Math.min(Math.max(point.x - textWidth / 2, 4), chartWidth - textWidth - 4);
            // Flip tooltip below the point when it would be cut off at the top
            const showBelow = point.y - 58 < 0;
            const tooltipY = showBelow ? point.y + 16 : point.y - 58;
            return (
              <g>
                {/* Tooltip background */}
                <rect x={tooltipX} y={tooltipY} width={textWidth} height={44} rx="8" ry="8"
                  fill={TOKENS.colors.text} opacity="0.92" />
                {/* Arrow */}
                {showBelow ? (
                  <polygon points={`${point.x - 6},${tooltipY} ${point.x + 6},${tooltipY} ${point.x},${tooltipY - 8}`}
                    fill={TOKENS.colors.text} opacity="0.92" />
                ) : (
                  <polygon points={`${point.x - 6},${tooltipY + 44} ${point.x + 6},${tooltipY + 44} ${point.x},${tooltipY + 52}`}
                    fill={TOKENS.colors.text} opacity="0.92" />
                )}
                {/* Value text */}
                <text x={tooltipX + textWidth / 2} y={tooltipY + 18} textAnchor="middle"
                  fontSize="13" fontWeight="700" fill={TOKENS.colors.surface}>
                  {label}
                </text>
                {/* Month text */}
                <text x={tooltipX + textWidth / 2} y={tooltipY + 34} textAnchor="middle"
                  fontSize="10" fill={TOKENS.colors.surface} opacity="0.7">
                  {monthLabel}
                </text>
              </g>
            );
          })()}
          
          {/* X-axis labels */}
          {visibleData.map((item, index) => {
            const x = chartPadding.left + (index / Math.max(visibleData.length - 1, 1)) * (chartWidth - chartPadding.left - chartPadding.right);
            return (
              <g key={index}>
                <text x={x} y={height - 20} textAnchor="middle" fontSize="11" fill={TOKENS.colors.textMuted}>
                  {item.month}
                </text>
                <text x={x} y={height - 5} textAnchor="middle" fontSize="9" fill={TOKENS.colors.textMuted}>
                  {item.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Improved Bar Chart with Y-axis scale
 */
function BarChartImproved({ 
  data, 
  dataKey, 
  color = TOKENS.colors.secondary,
  height = 280,
}: { 
  data: MonthlyData[]; 
  dataKey: 'orders' | 'revenue'; 
  color?: string;
  height?: number;
}) {
  const [visibleStart, setVisibleStart] = useState(Math.max(0, data.length - 6));
  const visibleData = data.slice(visibleStart, visibleStart + 6);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const allValues = data.map(d => d[dataKey] || 0);
  const maxValue = Math.max(...allValues, 1);
  
  // Generate nice Y-axis ticks
  const yTicks = useMemo(() => {
    const step = Math.ceil(maxValue / 4);
    return [0, step, step * 2, step * 3, step * 4].reverse();
  }, [maxValue]);

  const canGoBack = visibleStart > 0;
  const canGoForward = visibleStart + 6 < data.length;

  return (
    <div style={{ width: '100%' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: TOKENS.spacing[3] }}>
        <span style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary }}>
          {visibleData[0]?.month} {visibleData[0]?.year} - {visibleData[visibleData.length - 1]?.month} {visibleData[visibleData.length - 1]?.year}
        </span>
        <div style={{ display: 'flex', gap: TOKENS.spacing[2] }}>
          <button
            onClick={() => setVisibleStart(Math.max(0, visibleStart - 6))}
            disabled={!canGoBack}
            style={{
              padding: TOKENS.spacing[2],
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius.md,
              background: TOKENS.colors.surface,
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              opacity: canGoBack ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icons.ChevronLeft />
          </button>
          <button
            onClick={() => setVisibleStart(Math.min(data.length - 6, visibleStart + 6))}
            disabled={!canGoForward}
            style={{
              padding: TOKENS.spacing[2],
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius.md,
              background: TOKENS.colors.surface,
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              opacity: canGoForward ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icons.ChevronRight />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height }}>
        {/* Y-axis */}
        <div style={{ width: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '40px', paddingTop: '10px' }}>
          {yTicks.map((tick, i) => (
            <span key={i} style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textMuted, textAlign: 'right', paddingRight: TOKENS.spacing[2] }}>
              {formatCompactNumber(tick)}
            </span>
          ))}
        </div>
        
        {/* Bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative' }}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {yTicks.map((_, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${TOKENS.colors.borderLight}`, width: '100%' }} />
              ))}
            </div>
            
            {visibleData.map((item, index) => {
              const value = item[dataKey] || 0;
              const heightPercent = (value / maxValue) * 100;
              const isHovered = hoveredIndex === index;
              
              return (
                <div 
                  key={index}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', zIndex: 1 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Value label */}
                  <div style={{
                    fontSize: TOKENS.fontSize.sm,
                    fontWeight: TOKENS.fontWeight.bold,
                    color: TOKENS.colors.text,
                    marginBottom: TOKENS.spacing[1],
                    opacity: isHovered ? 1 : 0.7,
                    transition: 'opacity 0.15s ease',
                  }}>
                    {value}
                  </div>
                  
                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${Math.max(heightPercent, 2)}%`,
                    backgroundColor: color,
                    borderRadius: `${TOKENS.radius.sm} ${TOKENS.radius.sm} 0 0`,
                    opacity: isHovered ? 1 : 0.85,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }} />
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: TOKENS.spacing[2], height: '40px' }}>
            {visibleData.map((item, index) => (
              <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textMuted, display: 'block' }}>{item.month}</span>
                <span style={{ fontSize: '10px', color: TOKENS.colors.textMuted }}>{item.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal Bar Chart
 */
function HorizontalBarChart<T>({ 
  data, 
  labelKey, 
  valueKey,
  maxItems = 8,
  color = TOKENS.colors.secondary,
  formatValue = formatCompactNumber,
}: { 
  data: T[]; 
  labelKey: keyof T;
  valueKey: keyof T;
  maxItems?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const items = data.slice(0, maxItems);
  const maxValue = Math.max(...items.map(d => Number(d[valueKey]) || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const widthPercent = (value / maxValue) * 100;
        
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: TOKENS.radius.sm,
              backgroundColor: index < 3 ? TOKENS.colors.primaryLight : TOKENS.colors.borderLight,
              color: index < 3 ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.bold, flexShrink: 0,
            }}>
              {index + 1}
            </span>
            <span style={{
              width: '90px', fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
            }}>
              {String(item[labelKey])}
            </span>
            <div style={{ flex: 1, height: '24px', backgroundColor: TOKENS.colors.borderLight, borderRadius: TOKENS.radius.sm, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${widthPercent}%`, backgroundColor: color, borderRadius: TOKENS.radius.sm, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ width: '70px', fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.text, textAlign: 'right', flexShrink: 0 }}>
              {formatValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Donut Chart
 */
function DonutChart({ 
  data, 
  colors = [TOKENS.colors.primary, TOKENS.colors.secondary, TOKENS.colors.accent, TOKENS.colors.success, TOKENS.colors.warning],
}: { 
  data: { label: string; value: number }[];
  colors?: string[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  let currentAngle = -90;
  
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const radius = 40, innerRadius = 28, cx = 50, cy = 50;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    const path = percentage > 0 
      ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
      : '';
    
    return { ...item, percentage, path, color: colors[index % colors.length] };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[6], flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {segments.map((segment, index) => segment.path && (
            <path
              key={index} d={segment.path} fill={segment.color}
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
              style={{ transition: 'opacity 0.15s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: TOKENS.fontSize.lg, fontWeight: TOKENS.fontWeight.bold, color: TOKENS.colors.text }}>{total}</div>
          <div style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textMuted }}>Total</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
        {segments.map((segment, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.5, cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: segment.color }} />
            <span style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.text, minWidth: '80px' }}>{segment.label.replace(/_/g, ' ')}</span>
            <span style={{ fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.textSecondary }}>{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function StatCard({ icon, label, value, trend, variant = 'primary' }: {
  icon: React.ReactNode; label: string; value: string | number; trend?: number | null;
  variant?: 'primary' | 'secondary' | 'warning' | 'success';
}) {
  const variantColors = {
    primary: { bg: TOKENS.colors.primaryLight, text: TOKENS.colors.primary },
    secondary: { bg: TOKENS.colors.secondaryLight, text: TOKENS.colors.secondary },
    warning: { bg: TOKENS.colors.accentLight, text: TOKENS.colors.accent },
    success: { bg: TOKENS.colors.successLight, text: TOKENS.colors.success },
  };
  const colors = variantColors[variant];

  return (
    <div style={{ backgroundColor: TOKENS.colors.surface, border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.lg, padding: TOKENS.spacing[4] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: TOKENS.spacing[3] }}>
        <div style={{ width: '40px', height: '40px', borderRadius: TOKENS.radius.md, backgroundColor: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {trend !== null && trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.semibold, color: trend >= 0 ? TOKENS.colors.success : TOKENS.colors.error }}>
            {trend >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: TOKENS.fontSize.xl, fontWeight: TOKENS.fontWeight.bold, color: TOKENS.colors.text, lineHeight: 1, marginBottom: TOKENS.spacing[1] }}>{value}</div>
      <div style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary }}>{label}</div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: TOKENS.colors.surface, border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.lg, padding: TOKENS.spacing[5] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], marginBottom: TOKENS.spacing[4] }}>
        {icon && <span style={{ color: TOKENS.colors.textMuted }}>{icon}</span>}
        <h3 style={{ fontSize: TOKENS.fontSize.base, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.text, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ProductListItem({ product, rank, metric, metricLabel }: { product: ProductData; rank: number; metric: number; metricLabel: string }) {
  return (
    <div className="product-list-item" style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], padding: TOKENS.spacing[3], borderRadius: TOKENS.radius.md, border: `1px solid ${TOKENS.colors.borderLight}`, marginBottom: TOKENS.spacing[2] }}>
      <span style={{ width: '28px', height: '28px', borderRadius: TOKENS.radius.sm, backgroundColor: rank <= 3 ? TOKENS.colors.primaryLight : TOKENS.colors.borderLight, color: rank <= 3 ? TOKENS.colors.primary : TOKENS.colors.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.bold, flexShrink: 0 }}>{rank}</span>
      <div style={{ width: '48px', height: '48px', borderRadius: TOKENS.radius.md, overflow: 'hidden', backgroundColor: TOKENS.colors.borderLight, flexShrink: 0 }}>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.colors.textMuted }}><Icons.Package /></div>}
      </div>
      <div className="product-list-item-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.medium, color: TOKENS.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{product.name}</div>
        <div style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textSecondary, marginTop: '2px' }}>{metricLabel}</div>
      </div>
      <div className="product-list-item-metric" style={{ fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.bold, color: TOKENS.colors.primary, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {metricLabel.includes('revenue') ? formatCurrency(metric) : formatCompactNumber(metric)}
      </div>
    </div>
  );
}

function Skeleton({ width = '100%', height = '20px' }: { width?: string; height?: string }) {
  return <div style={{ width, height, backgroundColor: TOKENS.colors.borderLight, borderRadius: TOKENS.radius.sm, animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

// ============================================================================
// ADMIN PRODUCT TABLE
// ============================================================================

function AdminProductTable({ 
  products, 
  t, 
  onToggleVisibility, 
  onEdit, 
  onDelete,
  isTogglingId,
  isDeletingId,
}: { 
  products: ProductData[];
  t: typeof translations['en'];
  onToggleVisibility: (id: string, currentState: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isTogglingId: string | null;
  isDeletingId: string | null;
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [products, search]);
  
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], marginBottom: TOKENS.spacing[4] }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Icons.Search />
          <input
            type="text"
            placeholder={t.searchProducts}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%', padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]} ${TOKENS.spacing[3]} ${TOKENS.spacing[10]}`,
              border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.md, fontSize: TOKENS.fontSize.sm,
            }}
          />
        </div>
      </div>
      
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${TOKENS.colors.border}` }}>
              <th style={{ padding: TOKENS.spacing[3], textAlign: 'left', fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.textSecondary }}>{t.productName}</th>
              <th style={{ padding: TOKENS.spacing[3], textAlign: 'left', fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.textSecondary }}>{t.price}</th>
              <th style={{ padding: TOKENS.spacing[3], textAlign: 'center', fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.textSecondary }}>Status</th>
              <th style={{ padding: TOKENS.spacing[3], textAlign: 'right', fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, color: TOKENS.colors.textSecondary }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} style={{ borderBottom: `1px solid ${TOKENS.colors.borderLight}` }}>
                <td style={{ padding: TOKENS.spacing[3] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: TOKENS.radius.md, overflow: 'hidden', backgroundColor: TOKENS.colors.borderLight, flexShrink: 0 }}>
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.colors.textMuted }}><Icons.Package /></div>}
                    </div>
                    <div>
                      <div style={{ fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.medium, color: TOKENS.colors.text }}>{product.name}</div>
                      <div style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textMuted }}>{product.category}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: TOKENS.spacing[3], fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.text }}>
                  {product.basePriceMinor ? formatCurrency(product.basePriceMinor / 100) : '-'}
                </td>
                <td style={{ padding: TOKENS.spacing[3], textAlign: 'center' }}>
                  <span style={{
                    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`, borderRadius: TOKENS.radius.sm, fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.medium,
                    backgroundColor: product.isActive ? TOKENS.colors.successLight : TOKENS.colors.errorLight,
                    color: product.isActive ? TOKENS.colors.success : TOKENS.colors.error,
                  }}>
                    {product.isActive ? t.active : t.hidden}
                  </span>
                </td>
                <td style={{ padding: TOKENS.spacing[3] }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: TOKENS.spacing[2], flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onToggleVisibility(product.id, product.isActive || false)}
                      disabled={isTogglingId === product.id}
                      style={{
                        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`, border: `1px solid ${TOKENS.colors.border}`,
                        borderRadius: TOKENS.radius.md, backgroundColor: TOKENS.colors.surface, cursor: 'pointer',
                        fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.medium, display: 'flex', alignItems: 'center', gap: TOKENS.spacing[1],
                        opacity: isTogglingId === product.id ? 0.5 : 1,
                      }}
                    >
                      {product.isActive ? <><Icons.EyeOff /> {t.hide}</> : <><Icons.Eye /> {t.show}</>}
                    </button>
                    <button
                      onClick={() => onEdit(product.id)}
                      style={{
                        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`, border: 'none',
                        borderRadius: TOKENS.radius.md, backgroundColor: TOKENS.colors.primary, color: 'white', cursor: 'pointer',
                        fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.medium, display: 'flex', alignItems: 'center', gap: TOKENS.spacing[1],
                      }}
                    >
                      <Icons.Edit /> {t.edit}
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      disabled={isDeletingId === product.id}
                      style={{
                        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`, border: 'none',
                        borderRadius: TOKENS.radius.md, backgroundColor: TOKENS.colors.error, color: 'white', cursor: 'pointer',
                        fontSize: TOKENS.fontSize.xs, fontWeight: TOKENS.fontWeight.medium, display: 'flex', alignItems: 'center', gap: TOKENS.spacing[1],
                        opacity: isDeletingId === product.id ? 0.5 : 1,
                      }}
                    >
                      <Icons.Trash /> {isDeletingId === product.id ? t.deleting : t.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: TOKENS.spacing[2], marginTop: TOKENS.spacing[4] }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ padding: TOKENS.spacing[2], border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.md, background: TOKENS.colors.surface, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
            <Icons.ChevronLeft />
          </button>
          <span style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary }}>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ padding: TOKENS.spacing[2], border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.md, background: TOKENS.colors.surface, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
            <Icons.ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const router = useRouter();
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(12);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [deleteModalProductId, setDeleteModalProductId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      // Full page reload to ensure cookie is cleared before navigation
      window.location.href = '/admin/login';
    }
  }, []);
  
  // Map next-intl locale to our translations
  const lang: Lang = (locale === 'ar' || locale === 'fr') ? locale : 'en';
  const t = translations[lang];

  // Close time dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    
    const statsCacheKey = `admin-stats-${timeRange}`;
    const productsCacheKey = 'admin-products';
    
    // Try cache first (skip if refreshing)
    if (!showRefreshState) {
      const cachedStats = getCache<{ success: boolean; data: DashboardData }>(statsCacheKey);
      const cachedProducts = getCache<{ success: boolean; data: ProductData[] }>(productsCacheKey);
      
      if (cachedStats?.success && cachedStats.data) {
        setData(cachedStats.data);
        if (cachedProducts?.success && cachedProducts.data) {
          setAllProducts(cachedProducts.data);
        }
        setIsLoading(false);
        // Still fetch in background to update
        if (!cachedProducts) {
          fetch(`/api/admin/products`, { cache: 'no-store' })
            .then(res => res.json())
            .then(json => { if (json.success) { setAllProducts(json.data || []); setCache(productsCacheKey, json, 3 * 60 * 1000); } })
            .catch(() => {});
        }
        return;
      }
    }
    
    try {
      const [statsRes, productsRes] = await Promise.all([
        fetch(`/api/admin/stats?months=${timeRange}`, { cache: 'no-store' }),
        fetch(`/api/admin/products`, { cache: 'no-store' }),
      ]);
      
      if (!statsRes.ok) throw new Error(`HTTP ${statsRes.status}`);
      
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setData(statsJson.data);
        setCache(statsCacheKey, statsJson, 3 * 60 * 1000);
      } else {
        setError(statsJson.error || t.error);
      }
      
      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        if (productsJson.success) {
          setAllProducts(productsJson.data || []);
          setCache(productsCacheKey, productsJson, 3 * 60 * 1000);
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, t.error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleVisibility = async (productId: string, currentState: boolean) => {
    setIsTogglingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState }),
      });
      
      if (res.ok) {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: !currentState } : p));
        // Invalidate shopping page cache so hidden products are filtered
        invalidateCacheByPrefix('/api/products');
        invalidateCacheByPrefix('admin-products');
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeleteModalProductId(productId);
  };

  const confirmDeleteProduct = async () => {
    const productId = deleteModalProductId;
    if (!productId) return;
    setDeleteModalProductId(null);
    
    setIsDeletingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setAllProducts(prev => prev.filter(p => p.id !== productId));
        // Invalidate all product caches
        invalidateCacheByPrefix('/api/products');
        invalidateCacheByPrefix('admin-');
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/admin/product/${productId}`);
  };

  const growthMetrics = useMemo(() => {
    if (!data?.ordersPerMonth || data.ordersPerMonth.length < 2) return { orders: null, revenue: null };
    const midpoint = Math.floor(data.ordersPerMonth.length / 2);
    const recentOrders = data.ordersPerMonth.slice(midpoint).reduce((sum, d) => sum + (d.orders || 0), 0);
    const previousOrders = data.ordersPerMonth.slice(0, midpoint).reduce((sum, d) => sum + (d.orders || 0), 0);
    const recentRevenue = data.revenuePerMonth?.slice(midpoint).reduce((sum, d) => sum + (d.revenue || 0), 0) || 0;
    const previousRevenue = data.revenuePerMonth?.slice(0, midpoint).reduce((sum, d) => sum + (d.revenue || 0), 0) || 0;
    return { orders: calculateGrowth(recentOrders, previousOrders), revenue: calculateGrowth(recentRevenue, previousRevenue) };
  }, [data]);

  const statusData = useMemo(() => {
    if (!data?.statusBreakdown) return [];
    return Object.entries(data.statusBreakdown).map(([label, value]) => ({ label: label.charAt(0) + label.slice(1).toLowerCase(), value }));
  }, [data]);

  return (
    <>
      <style jsx global>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .product-list-item { flex-wrap: wrap; }
          .product-list-item-info { min-width: calc(100% - 90px); }
          .admin-header-controls { flex-direction: column; align-items: stretch !important; }
          .admin-table-actions { flex-direction: column; }
          .charts-grid > div { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .charts-grid > div > div:last-child { min-width: 500px; }
        }
      `}</style>

      <Header />
      
      <div style={{ minHeight: '100vh', backgroundColor: TOKENS.colors.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Admin Header */}
        <div style={{ backgroundColor: TOKENS.colors.surface, borderBottom: `1px solid ${TOKENS.colors.border}`, padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[6]}` }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: TOKENS.spacing[4], flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: TOKENS.fontSize['2xl'], fontWeight: TOKENS.fontWeight.bold, color: TOKENS.colors.text, margin: 0 }}>{t.dashboard}</h1>
              <p style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary, margin: 0 }}>{t.subtitle}</p>
            </div>
            <div className="admin-header-controls" style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], flexWrap: 'wrap' }}>
              {/* Time Range Custom Dropdown */}
              <div ref={timeDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  style={{
                    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                    paddingRight: TOKENS.spacing[8],
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: TOKENS.radius.md,
                    fontSize: TOKENS.fontSize.sm,
                    backgroundColor: TOKENS.colors.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: TOKENS.spacing[2],
                    position: 'relative',
                    minWidth: '160px',
                    color: TOKENS.colors.text,
                    fontWeight: TOKENS.fontWeight.medium,
                  }}
                >
                  {timeRange === 3 ? t.last3Months : timeRange === 6 ? t.last6Months : t.last12Months}
                  <span style={{ position: 'absolute', right: TOKENS.spacing[3], top: '50%', transform: `translateY(-50%) rotate(${isTimeDropdownOpen ? '180deg' : '0deg'})`, transition: 'transform 0.2s ease', display: 'flex' }}>
                    <Icons.ChevronDown />
                  </span>
                </button>
                {isTimeDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: TOKENS.colors.surface,
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: TOKENS.radius.md,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}>
                    {[
                      { value: 3, label: t.last3Months },
                      { value: 6, label: t.last6Months },
                      { value: 12, label: t.last12Months },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimeRange(option.value);
                          setIsTimeDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                          border: 'none',
                          backgroundColor: timeRange === option.value ? TOKENS.colors.primaryLight : 'transparent',
                          color: timeRange === option.value ? TOKENS.colors.primary : TOKENS.colors.text,
                          cursor: 'pointer',
                          fontSize: TOKENS.fontSize.sm,
                          fontWeight: timeRange === option.value ? TOKENS.fontWeight.semibold : TOKENS.fontWeight.normal,
                          textAlign: 'left',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (timeRange !== option.value) (e.target as HTMLButtonElement).style.backgroundColor = TOKENS.colors.borderLight;
                        }}
                        onMouseLeave={(e) => {
                          if (timeRange !== option.value) (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Refresh */}
              <button onClick={() => fetchData(true)} disabled={isRefreshing}
                style={{ width: '40px', height: '40px', border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.md, backgroundColor: TOKENS.colors.surface, cursor: isRefreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.colors.textSecondary, animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
                <Icons.RefreshCw />
              </button>
              
              {/* Add Product */}
              <Link href="/admin/product/new" style={{
                padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`, backgroundColor: TOKENS.colors.primary, color: 'white', borderRadius: TOKENS.radius.md,
                fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2],
              }}>
                <Icons.Plus /> {t.addProduct}
              </Link>

              {/* Logout */}
              <button onClick={handleLogout} disabled={isLoggingOut}
                style={{ width: '40px', height: '40px', border: `1px solid ${TOKENS.colors.error}`, borderRadius: TOKENS.radius.md, backgroundColor: 'transparent', cursor: isLoggingOut ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.colors.error }}
                title={t.logout}
              >
                <Icons.LogOut />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: TOKENS.spacing[6] }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[6] }}>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: TOKENS.spacing[4] }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ backgroundColor: TOKENS.colors.surface, border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.lg, padding: TOKENS.spacing[5] }}>
                    <Skeleton width="44px" height="44px" />
                    <div style={{ marginTop: TOKENS.spacing[4] }}><Skeleton width="60%" height="28px" /></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: TOKENS.spacing[4] }}>
              <p style={{ fontSize: TOKENS.fontSize.base, color: TOKENS.colors.textSecondary }}>{error}</p>
              <button onClick={() => fetchData()} style={{ padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`, backgroundColor: TOKENS.colors.primary, color: 'white', border: 'none', borderRadius: TOKENS.radius.md, fontSize: TOKENS.fontSize.sm, fontWeight: TOKENS.fontWeight.semibold, cursor: 'pointer' }}>
                {t.tryAgain}
              </button>
            </div>
          ) : data ? (
            <>
              {/* KPI Cards */}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6] }}>
                <StatCard icon={<Icons.DollarSign />} label={t.totalRevenue} value={formatCurrency(data.summary.totalRevenue)} trend={growthMetrics.revenue} variant="primary" />
                <StatCard icon={<Icons.ShoppingCart />} label={t.totalOrders} value={formatCompactNumber(data.summary.totalOrders)} trend={growthMetrics.orders} variant="secondary" />
                <StatCard icon={<Icons.Package />} label={t.avgOrderValue} value={formatCurrency(data.summary.avgOrderValue)} variant="warning" />
                <StatCard icon={<Icons.Eye />} label={t.productViews} value={formatCompactNumber(data.summary.totalClicks)} variant="success" />
              </div>

              {/* Charts */}
              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6] }}>
                <Card title={t.revenueTrend} icon={<Icons.Activity />}>
                  <LineChartImproved data={data.revenuePerMonth} dataKey="revenue" color={TOKENS.colors.primary} height={300} />
                </Card>
                <Card title={t.ordersPerMonth} icon={<Icons.BarChart />}>
                  <BarChartImproved data={data.ordersPerMonth} dataKey="orders" color={TOKENS.colors.secondary} height={300} />
                </Card>
              </div>

              {/* Geographic & Category */}
              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6] }}>
                <Card title={t.ordersByWilaya} icon={<Icons.MapPin />}>
                  {data.ordersByWilaya.length > 0 ? <HorizontalBarChart data={data.ordersByWilaya} labelKey="name" valueKey="orders" maxItems={8} color={TOKENS.colors.secondary} /> : <div style={{ padding: TOKENS.spacing[8], textAlign: 'center', color: TOKENS.colors.textMuted }}>{t.noData}</div>}
                </Card>
                <Card title={t.categoryPerformance} icon={<Icons.Layers />}>
                  {data.categoryPerformance.length > 0 ? <HorizontalBarChart data={data.categoryPerformance} labelKey="name" valueKey="revenue" maxItems={6} color={TOKENS.colors.primary} formatValue={formatCurrency} /> : <div style={{ padding: TOKENS.spacing[8], textAlign: 'center', color: TOKENS.colors.textMuted }}>{t.noData}</div>}
                </Card>
              </div>

              {/* Top Products */}
              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOKENS.spacing[4], marginBottom: TOKENS.spacing[6] }}>
                <Card title={t.topSelling} icon={<Icons.TrendingUp />}>
                  {data.topSellingProducts.length > 0 ? data.topSellingProducts.slice(0, 5).map((product, index) => (
                    <ProductListItem key={product.id} product={product} rank={index + 1} metric={product.revenue || 0} metricLabel={`${product.salesCount} ${t.sold} · ${t.revenue}`} />
                  )) : <div style={{ padding: TOKENS.spacing[8], textAlign: 'center', color: TOKENS.colors.textMuted }}>{t.noSalesYet}</div>}
                </Card>
                <Card title={t.mostViewed} icon={<Icons.Eye />}>
                  {data.mostClickedProducts.length > 0 ? data.mostClickedProducts.slice(0, 5).map((product, index) => (
                    <ProductListItem key={product.id} product={product} rank={index + 1} metric={product.clicks || 0} metricLabel={t.views} />
                  )) : <div style={{ padding: TOKENS.spacing[8], textAlign: 'center', color: TOKENS.colors.textMuted }}>{t.noViewsYet}</div>}
                </Card>
              </div>

              {/* Order Status */}
              {statusData.length > 0 && (
                <Card title={t.orderStatus} icon={<Icons.Package />}>
                  <DonutChart data={statusData} />
                </Card>
              )}

              {/* All Products Table */}
              <div style={{ marginTop: TOKENS.spacing[8] }}>
                <Card title={t.allProducts} icon={<Icons.Package />}>
                  <AdminProductTable products={allProducts} t={t} onToggleVisibility={handleToggleVisibility} onEdit={handleEditProduct} onDelete={handleDeleteProduct} isTogglingId={isTogglingId} isDeletingId={isDeletingId} />
                </Card>
              </div>
            </>
          ) : null}
        </main>
      </div>
      
      <Footer />

      {/* Delete Confirmation Modal */}
      {deleteModalProductId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}
          onClick={() => setDeleteModalProductId(null)}
        >
          <div
            style={{
              backgroundColor: TOKENS.colors.surface, borderRadius: TOKENS.radius.xl,
              padding: TOKENS.spacing[8], maxWidth: '420px', width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: TOKENS.colors.errorLight, margin: '0 auto 16px' }}>
              <Icons.Trash />
            </div>
            <h3 style={{ textAlign: 'center', fontSize: TOKENS.fontSize.lg, fontWeight: TOKENS.fontWeight.bold, color: TOKENS.colors.text, margin: `0 0 ${TOKENS.spacing[2]}` }}>
              {t.delete}
            </h3>
            <p style={{ textAlign: 'center', fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary, margin: `0 0 ${TOKENS.spacing[6]}`, lineHeight: 1.5 }}>
              {t.deleteConfirm}
            </p>
            <div style={{ display: 'flex', gap: TOKENS.spacing[3] }}>
              <button
                onClick={() => setDeleteModalProductId(null)}
                style={{
                  flex: 1, padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                  border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.radius.md,
                  backgroundColor: TOKENS.colors.surface, fontSize: TOKENS.fontSize.sm,
                  fontWeight: TOKENS.fontWeight.semibold, cursor: 'pointer', color: TOKENS.colors.text,
                }}
              >
                {lang === 'ar' ? 'إلغاء' : lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={confirmDeleteProduct}
                style={{
                  flex: 1, padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                  border: 'none', borderRadius: TOKENS.radius.md,
                  backgroundColor: TOKENS.colors.error, color: 'white', fontSize: TOKENS.fontSize.sm,
                  fontWeight: TOKENS.fontWeight.semibold, cursor: 'pointer',
                }}
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}