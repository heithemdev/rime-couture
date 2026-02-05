/**
 * RIME COUTURE - Admin Analytics Dashboard
 * =========================================
 * Premium analytics dashboard for e-commerce operations
 * 
 * Industry: Luxury Fashion & Traditional Algerian Couture
 * Department: Operations & Sales Analytics
 * 
 * Business Objectives:
 * - Monitor sales performance across products and categories
 * - Track regional distribution of orders across Algeria's wilayas
 * - Identify top-performing products and trends
 * - Optimize inventory based on demand patterns
 * 
 * Brand Colors:
 * - Primary: #be185d (Rose/Magenta - luxury, elegance)
 * - Secondary: #2dafaa (Teal - trust, growth)
 * - Accent: #f59e0b (Amber - premium, warmth)
 * - Neutral: #0f172a (Slate - professionalism)
 * 
 * Design System: 8pt grid, System UI typography
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

// ============================================================================
// DESIGN TOKENS (8pt Grid System)
// ============================================================================

const TOKENS = {
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  colors: {
    // Brand
    primary: '#be185d',
    primaryLight: '#fdf2f8',
    secondary: '#2dafaa',
    secondaryLight: '#f0fdfa',
    accent: '#f59e0b',
    accentLight: '#fffbeb',
    // Semantic
    success: '#059669',
    successLight: '#ecfdf5',
    warning: '#d97706',
    warningLight: '#fffbeb',
    error: '#dc2626',
    errorLight: '#fef2f2',
    // Neutral
    bg: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
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
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ============================================================================
// ICON COMPONENTS (Inline SVG for better performance)
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
};

// ============================================================================
// CHART COMPONENTS
// ============================================================================

/**
 * Line/Area Chart Component
 */
function LineChart({ 
  data, 
  dataKey, 
  color = TOKENS.colors.primary,
  height = 200,
  showArea = true,
}: { 
  data: MonthlyData[]; 
  dataKey: 'orders' | 'revenue'; 
  color?: string;
  height?: number;
  showArea?: boolean;
}) {
  const values = data.map(d => d[dataKey] || 0);
  const maxValue = Math.max(...values, 1);
  const range = maxValue - Math.min(...values) || 1;
  
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartHeight = height - padding.top - padding.bottom;
  
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = ((maxValue - value) / range) * chartHeight + padding.top;
    return { x, y, value };
  });
  
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1]!;
    const cpX = (prev.x + point.x) / 2;
    return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  
  const areaPath = `${linePath} L 100 ${chartHeight + padding.top} L 0 ${chartHeight + padding.top} Z`;

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={padding.top + chartHeight * ratio}
            x2="100"
            y2={padding.top + chartHeight * ratio}
            stroke={TOKENS.colors.borderLight}
            strokeWidth="0.3"
          />
        ))}
        
        {showArea && (
          <path d={areaPath} fill={color} fillOpacity="0.1" />
        )}
        
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={TOKENS.colors.surface}
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        padding: `0 ${padding.left}px`,
      }}>
        {data.map((item, index) => (
          <span 
            key={index}
            style={{
              fontSize: '10px',
              color: TOKENS.colors.textMuted,
              textAlign: 'center',
              flex: 1,
            }}
          >
            {item.month.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Bar Chart Component
 */
function BarChart({ 
  data, 
  dataKey, 
  color = TOKENS.colors.secondary,
  height = 200,
}: { 
  data: MonthlyData[]; 
  dataKey: 'orders' | 'revenue'; 
  color?: string;
  height?: number;
}) {
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '4px',
        paddingBottom: TOKENS.spacing[6],
      }}>
        {data.map((item, index) => {
          const value = item[dataKey] || 0;
          const heightPercent = (value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          
          return (
            <div 
              key={index}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={{
                fontSize: TOKENS.fontSize.xs,
                fontWeight: TOKENS.fontWeight.semibold,
                color: TOKENS.colors.text,
                marginBottom: TOKENS.spacing[1],
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s ease',
                whiteSpace: 'nowrap',
              }}>
                {dataKey === 'revenue' ? formatCurrency(value) : formatCompactNumber(value)}
              </div>
              
              <div style={{
                width: '100%',
                maxWidth: '32px',
                height: `${Math.max(heightPercent, 2)}%`,
                backgroundColor: color,
                borderRadius: `${TOKENS.radius.sm} ${TOKENS.radius.sm} 0 0`,
                opacity: isHovered ? 1 : 0.8,
                transition: 'opacity 0.15s ease, height 0.3s ease',
                cursor: 'pointer',
              }} />
              
              <span style={{
                fontSize: '10px',
                color: TOKENS.colors.textMuted,
                marginTop: TOKENS.spacing[2],
                textAlign: 'center',
              }}>
                {item.month.split(' ')[0]}
              </span>
            </div>
          );
        })}
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const widthPercent = (value / maxValue) * 100;
        const isHovered = hoveredIndex === index;
        
        return (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: TOKENS.spacing[3],
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: TOKENS.radius.sm,
              backgroundColor: index < 3 ? TOKENS.colors.primaryLight : TOKENS.colors.borderLight,
              color: index < 3 ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: TOKENS.fontSize.xs,
              fontWeight: TOKENS.fontWeight.bold,
              flexShrink: 0,
            }}>
              {index + 1}
            </span>
            
            <span style={{
              width: '100px',
              fontSize: TOKENS.fontSize.sm,
              color: TOKENS.colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0,
            }}>
              {String(item[labelKey])}
            </span>
            
            <div style={{
              flex: 1,
              height: '24px',
              backgroundColor: TOKENS.colors.borderLight,
              borderRadius: TOKENS.radius.sm,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${widthPercent}%`,
                backgroundColor: color,
                borderRadius: TOKENS.radius.sm,
                opacity: isHovered ? 1 : 0.85,
                transition: 'opacity 0.15s ease, width 0.3s ease',
              }} />
            </div>
            
            <span style={{
              width: '70px',
              fontSize: TOKENS.fontSize.sm,
              fontWeight: TOKENS.fontWeight.semibold,
              color: TOKENS.colors.text,
              textAlign: 'right',
              flexShrink: 0,
            }}>
              {formatValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Donut Chart Component
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
    const radius = 40;
    const innerRadius = 28;
    const cx = 50;
    const cy = 50;
    
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
              key={index}
              d={segment.path}
              fill={segment.color}
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
              style={{ transition: 'opacity 0.15s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ 
            fontSize: TOKENS.fontSize.lg, 
            fontWeight: TOKENS.fontWeight.bold,
            color: TOKENS.colors.text,
          }}>
            {total}
          </div>
          <div style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textMuted }}>
            Total
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
        {segments.map((segment, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: TOKENS.spacing[2],
              opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.5,
              transition: 'opacity 0.15s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: segment.color,
            }} />
            <span style={{ 
              fontSize: TOKENS.fontSize.sm, 
              color: TOKENS.colors.text,
              minWidth: '80px',
            }}>
              {segment.label.replace(/_/g, ' ')}
            </span>
            <span style={{ 
              fontSize: TOKENS.fontSize.sm, 
              fontWeight: TOKENS.fontWeight.semibold,
              color: TOKENS.colors.textSecondary,
            }}>
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  trend,
  variant = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number | null;
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
    <div style={{
      backgroundColor: TOKENS.colors.surface,
      border: `1px solid ${TOKENS.colors.border}`,
      borderRadius: TOKENS.radius.lg,
      padding: TOKENS.spacing[5],
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: TOKENS.radius.md,
          backgroundColor: colors.bg,
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        
        {trend !== null && trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: TOKENS.spacing[1],
            fontSize: TOKENS.fontSize.xs,
            fontWeight: TOKENS.fontWeight.semibold,
            color: trend >= 0 ? TOKENS.colors.success : TOKENS.colors.error,
          }}>
            {trend >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      
      <div>
        <div style={{
          fontSize: TOKENS.fontSize['2xl'],
          fontWeight: TOKENS.fontWeight.bold,
          color: TOKENS.colors.text,
          lineHeight: 1,
          marginBottom: TOKENS.spacing[1],
        }}>
          {value}
        </div>
        <div style={{ fontSize: TOKENS.fontSize.sm, color: TOKENS.colors.textSecondary }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: TOKENS.colors.surface,
      border: `1px solid ${TOKENS.colors.border}`,
      borderRadius: TOKENS.radius.lg,
      padding: TOKENS.spacing[5],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: TOKENS.spacing[5],
      }}>
        <h3 style={{
          fontSize: TOKENS.fontSize.base,
          fontWeight: TOKENS.fontWeight.semibold,
          color: TOKENS.colors.text,
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          margin: 0,
        }}>
          {icon && <span style={{ color: TOKENS.colors.textMuted }}>{icon}</span>}
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ProductListItem({
  product,
  rank,
  metric,
  metricLabel,
}: {
  product: ProductData;
  rank: number;
  metric: number;
  metricLabel: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[3],
        padding: TOKENS.spacing[3],
        borderRadius: TOKENS.radius.md,
        backgroundColor: isHovered ? TOKENS.colors.borderLight : 'transparent',
        transition: 'background 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{
        width: '24px',
        height: '24px',
        borderRadius: TOKENS.radius.sm,
        backgroundColor: rank <= 3 ? TOKENS.colors.primaryLight : TOKENS.colors.borderLight,
        color: rank <= 3 ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: TOKENS.fontSize.xs,
        fontWeight: TOKENS.fontWeight.bold,
        flexShrink: 0,
      }}>
        {rank}
      </span>
      
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: TOKENS.radius.md,
        overflow: 'hidden',
        backgroundColor: TOKENS.colors.borderLight,
        flexShrink: 0,
      }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: TOKENS.colors.textMuted,
          }}>
            <Icons.Package />
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: TOKENS.fontSize.sm,
          fontWeight: TOKENS.fontWeight.medium,
          color: TOKENS.colors.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {product.name}
        </div>
        <div style={{ fontSize: TOKENS.fontSize.xs, color: TOKENS.colors.textSecondary }}>
          {metricLabel}
        </div>
      </div>
      
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: TOKENS.fontSize.base,
          fontWeight: TOKENS.fontWeight.bold,
          color: TOKENS.colors.text,
        }}>
          {typeof metric === 'number' && metricLabel.includes('revenue') 
            ? formatCurrency(metric) 
            : formatCompactNumber(metric)}
        </div>
      </div>
    </div>
  );
}

function Skeleton({ width = '100%', height = '20px' }: { width?: string; height?: string }) {
  return (
    <div style={{
      width,
      height,
      backgroundColor: TOKENS.colors.borderLight,
      borderRadius: TOKENS.radius.sm,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(12);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/stats?months=${timeRange}`, {
        cache: 'no-store',
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load analytics data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to connect to analytics server. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const growthMetrics = useMemo(() => {
    if (!data?.ordersPerMonth || data.ordersPerMonth.length < 2) {
      return { orders: null, revenue: null };
    }
    
    const midpoint = Math.floor(data.ordersPerMonth.length / 2);
    const recentPeriod = data.ordersPerMonth.slice(midpoint);
    const previousPeriod = data.ordersPerMonth.slice(0, midpoint);
    
    const recentOrders = recentPeriod.reduce((sum, d) => sum + (d.orders || 0), 0);
    const previousOrders = previousPeriod.reduce((sum, d) => sum + (d.orders || 0), 0);
    
    const recentRevenue = data.revenuePerMonth?.slice(midpoint).reduce((sum, d) => sum + (d.revenue || 0), 0) || 0;
    const previousRevenue = data.revenuePerMonth?.slice(0, midpoint).reduce((sum, d) => sum + (d.revenue || 0), 0) || 0;
    
    return {
      orders: calculateGrowth(recentOrders, previousOrders),
      revenue: calculateGrowth(recentRevenue, previousRevenue),
    };
  }, [data]);

  const statusData = useMemo(() => {
    if (!data?.statusBreakdown) return [];
    return Object.entries(data.statusBreakdown).map(([label, value]) => ({
      label: label.charAt(0) + label.slice(1).toLowerCase(),
      value,
    }));
  }, [data]);

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        backgroundColor: TOKENS.colors.bg,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: TOKENS.colors.surface,
          borderBottom: `1px solid ${TOKENS.colors.border}`,
          padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[6]}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: TOKENS.spacing[4],
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[4] }}>
              <Link 
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: TOKENS.radius.md,
                  color: TOKENS.colors.textSecondary,
                  textDecoration: 'none',
                }}
              >
                <Icons.ArrowLeft />
              </Link>
              
              <div>
                <h1 style={{
                  fontSize: TOKENS.fontSize.xl,
                  fontWeight: TOKENS.fontWeight.bold,
                  color: TOKENS.colors.text,
                  margin: 0,
                }}>
                  Analytics Dashboard
                </h1>
                <p style={{
                  fontSize: TOKENS.fontSize.sm,
                  color: TOKENS.colors.textSecondary,
                  margin: 0,
                }}>
                  Rime Couture Operations Overview
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                style={{
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                  border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSize.sm,
                  fontWeight: TOKENS.fontWeight.medium,
                  color: TOKENS.colors.text,
                  backgroundColor: TOKENS.colors.surface,
                  cursor: 'pointer',
                }}
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
              
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                style={{
                  width: '40px',
                  height: '40px',
                  border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: TOKENS.radius.md,
                  backgroundColor: TOKENS.colors.surface,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: TOKENS.colors.textSecondary,
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <Icons.RefreshCw />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: TOKENS.spacing[6],
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[6] }}>
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: TOKENS.spacing[4],
              }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    backgroundColor: TOKENS.colors.surface,
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: TOKENS.radius.lg,
                    padding: TOKENS.spacing[5],
                  }}>
                    <Skeleton width="44px" height="44px" />
                    <div style={{ marginTop: TOKENS.spacing[4] }}>
                      <Skeleton width="60%" height="28px" />
                      <div style={{ marginTop: TOKENS.spacing[2] }}>
                        <Skeleton width="80%" height="16px" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[4],
              }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{
                    backgroundColor: TOKENS.colors.surface,
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: TOKENS.radius.lg,
                    padding: TOKENS.spacing[5],
                  }}>
                    <Skeleton width="40%" height="20px" />
                    <div style={{ marginTop: TOKENS.spacing[5] }}>
                      <Skeleton height="200px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              gap: TOKENS.spacing[4],
              color: TOKENS.colors.textSecondary,
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: TOKENS.colors.errorLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.error} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p style={{ fontSize: TOKENS.fontSize.base, margin: 0 }}>{error}</p>
              <button
                onClick={() => fetchData()}
                style={{
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
                  backgroundColor: TOKENS.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSize.sm,
                  fontWeight: TOKENS.fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <>
              {/* KPI Summary Cards */}
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: TOKENS.spacing[4],
                marginBottom: TOKENS.spacing[6],
              }}>
                <StatCard
                  icon={<Icons.DollarSign />}
                  label="Total Revenue"
                  value={formatCurrency(data.summary.totalRevenue)}
                  trend={growthMetrics.revenue}
                  variant="primary"
                />
                <StatCard
                  icon={<Icons.ShoppingCart />}
                  label="Total Orders"
                  value={formatCompactNumber(data.summary.totalOrders)}
                  trend={growthMetrics.orders}
                  variant="secondary"
                />
                <StatCard
                  icon={<Icons.Package />}
                  label="Avg. Order Value"
                  value={formatCurrency(data.summary.avgOrderValue)}
                  variant="warning"
                />
                <StatCard
                  icon={<Icons.Eye />}
                  label="Product Views"
                  value={formatCompactNumber(data.summary.totalClicks)}
                  variant="success"
                />
              </div>

              {/* Revenue & Orders Charts */}
              <div className="charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[4],
                marginBottom: TOKENS.spacing[6],
              }}>
                <Card title="Revenue Trend" icon={<Icons.Activity />}>
                  <LineChart
                    data={data.revenuePerMonth}
                    dataKey="revenue"
                    color={TOKENS.colors.primary}
                    height={220}
                    showArea={true}
                  />
                </Card>
                
                <Card title="Orders per Month" icon={<Icons.BarChart />}>
                  <BarChart
                    data={data.ordersPerMonth}
                    dataKey="orders"
                    color={TOKENS.colors.secondary}
                    height={220}
                  />
                </Card>
              </div>

              {/* Geographic & Category Distribution */}
              <div className="charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[4],
                marginBottom: TOKENS.spacing[6],
              }}>
                <Card title="Orders by Wilaya" icon={<Icons.MapPin />}>
                  {data.ordersByWilaya.length > 0 ? (
                    <HorizontalBarChart
                      data={data.ordersByWilaya}
                      labelKey="name"
                      valueKey="orders"
                      maxItems={8}
                      color={TOKENS.colors.secondary}
                    />
                  ) : (
                    <div style={{
                      padding: TOKENS.spacing[8],
                      textAlign: 'center',
                      color: TOKENS.colors.textMuted,
                    }}>
                      No geographic data available
                    </div>
                  )}
                </Card>
                
                <Card title="Category Performance" icon={<Icons.Layers />}>
                  {data.categoryPerformance.length > 0 ? (
                    <HorizontalBarChart
                      data={data.categoryPerformance}
                      labelKey="name"
                      valueKey="revenue"
                      maxItems={6}
                      color={TOKENS.colors.primary}
                      formatValue={formatCurrency}
                    />
                  ) : (
                    <div style={{
                      padding: TOKENS.spacing[8],
                      textAlign: 'center',
                      color: TOKENS.colors.textMuted,
                    }}>
                      No category data available
                    </div>
                  )}
                </Card>
              </div>

              {/* Product Performance */}
              <div className="charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[4],
                marginBottom: TOKENS.spacing[6],
              }}>
                <Card title="Top Selling Products" icon={<Icons.TrendingUp />}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.topSellingProducts.length > 0 ? (
                      data.topSellingProducts.slice(0, 5).map((product, index) => (
                        <ProductListItem
                          key={product.id}
                          product={product}
                          rank={index + 1}
                          metric={product.revenue || 0}
                          metricLabel={`${product.salesCount} sold · revenue`}
                        />
                      ))
                    ) : (
                      <div style={{
                        padding: TOKENS.spacing[8],
                        textAlign: 'center',
                        color: TOKENS.colors.textMuted,
                      }}>
                        No sales data yet
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card title="Most Viewed Products" icon={<Icons.Eye />}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.mostClickedProducts.length > 0 ? (
                      data.mostClickedProducts.slice(0, 5).map((product, index) => (
                        <ProductListItem
                          key={product.id}
                          product={product}
                          rank={index + 1}
                          metric={product.clicks || 0}
                          metricLabel="views"
                        />
                      ))
                    ) : (
                      <div style={{
                        padding: TOKENS.spacing[8],
                        textAlign: 'center',
                        color: TOKENS.colors.textMuted,
                      }}>
                        No view data yet
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Order Status Distribution */}
              {statusData.length > 0 && (
                <Card title="Order Status Distribution" icon={<Icons.Package />}>
                  <DonutChart data={statusData} />
                </Card>
              )}
            </>
          ) : null}
        </main>
        
        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${TOKENS.colors.border}`,
          padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[6]}`,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: TOKENS.fontSize.sm,
            color: TOKENS.colors.textMuted,
            margin: 0,
          }}>
            © {new Date().getFullYear()} Rime Couture · Analytics Dashboard
          </p>
        </footer>
      </div>
    </>
  );
}
