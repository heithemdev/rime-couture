//apps/web/app/api/admin/stats/route.ts
/**
 * Admin Statistics API Route
 * Fetches aggregated data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { requireAdmin } from '@/lib/auth/require-admin';

// Retry helper for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isTimeoutError = error instanceof Error && (
        error.message.includes('Connection terminated') ||
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('connection pool')
      );
      
      if (!isTimeoutError || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[Admin Stats API] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);
    
    // Calculate date range (last N months)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all required data in parallel
    const [
      orders,
      // REPLACED: Fetching top products via OrderItems aggregation instead of static salesCount
      topSellingAggregated, 
      analytics,
      categories,
    ] = await withRetry(() => Promise.all([
      // Orders with items for revenue calculation
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          deletedAt: null,
          status: { not: 'PENDING' } // Filter out pending orders for accurate stats
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalMinor: true,
          wilayaCode: true,
          wilayaName: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              lineTotalMinor: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      
      // NEW: Dynamic aggregation for top selling products
      prisma.orderItem.groupBy({
        by: ['productId', 'productName', 'productSlug', 'productImageUrl'],
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: 'PENDING' },
            deletedAt: null,
          }
        },
        _sum: {
          quantity: true,
          lineTotalMinor: true,
        },
        orderBy: {
          _sum: { quantity: 'desc' }
        },
        take: 10,
      }),
      
      // Analytics events for clicks
      prisma.analyticsEvent.findMany({
        where: {
          type: 'VIEW_PRODUCT',
          occurredAt: { gte: startDate },
        },
        select: {
          productId: true,
          occurredAt: true,
        },
      }),
      
      // Categories
      prisma.category.findMany({
        select: {
          id: true,
          slug: true,
          translations: {
            where: { locale: 'EN' },
            select: { name: true },
          },
        },
      }),
    ]));

    // We also need full product details for the "All Products" table/list if used elsewhere, 
    // but for the dashboard stats specifically, we use the aggregated data.
    // If you need the full product list for the table below the charts, we fetch it here separately
    // to keep the "Top Selling" logic pure.
    const allProducts = await prisma.product.findMany({
        where: { deletedAt: null },
        select: {
            id: true, slug: true, isActive: true, basePriceMinor: true, categoryId: true,
            translations: { where: { locale: 'EN' }, select: { name: true } },
            media: { where: { isThumb: true }, take: 1, select: { media: { select: { url: true } } } }
        }
    });

    // ========== PROCESS DATA ==========

    // 1. Orders & Revenue per month
    // FIX: Typed interface to prevent "string | undefined" error
    interface MonthlyStat { orders: number; revenue: number; year: number; monthName: string; }
    const monthlyData: Record<string, MonthlyStat> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months to ensure continuity in charts
    for (let i = 0; i < months; i++) {
      const d = new Date(); // Start from today and go back
      d.setMonth(d.getMonth() - i);
      const mIndex = d.getMonth();
      const year = d.getFullYear();
      const name = monthNames[mIndex] || 'Unknown'; // Fallback for safety
      const key = `${name}-${year}`; // Unique key
      
      monthlyData[key] = { 
          orders: 0, 
          revenue: 0, 
          year: year, 
          monthName: name 
      };
    }
    
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const mIndex = d.getMonth();
      const year = d.getFullYear();
      const name = monthNames[mIndex] || 'Unknown';
      const key = `${name}-${year}`;
      
      // If the month is within our initialized range
      if (monthlyData[key]) {
        monthlyData[key]!.orders += 1;
        monthlyData[key]!.revenue += order.totalMinor / 100;
      }
    }

    // Convert to array and reverse (so it goes Jan -> Dec, or Oldest -> Newest)
    const timeline = Object.values(monthlyData).reverse();

    const ordersPerMonth = timeline.map(data => ({
      month: data.monthName,
      year: data.year,
      orders: data.orders,
    }));

    const revenuePerMonth = timeline.map(data => ({
      month: data.monthName,
      year: data.year,
      revenue: Math.round(data.revenue),
    }));

    // 2. Orders by Wilaya
    const wilayaMap: Record<string, { code: number; name: string; orders: number; revenue: number }> = {};
    for (const order of orders) {
      const key = order.wilayaCode.toString();
      if (!wilayaMap[key]) {
        wilayaMap[key] = {
          code: order.wilayaCode,
          name: order.wilayaName,
          orders: 0,
          revenue: 0,
        };
      }
      wilayaMap[key]!.orders += 1;
      wilayaMap[key]!.revenue += order.totalMinor / 100;
    }
    
    const ordersByWilaya = Object.values(wilayaMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 15);

    // 3. Top Selling Products (FIXED: Uses Aggregated Data)
    const topSellingProducts = topSellingAggregated.map(item => ({
        id: item.productId || 'unknown',
        name: item.productName,
        slug: item.productSlug,
        salesCount: item._sum.quantity || 0,
        revenue: (item._sum.lineTotalMinor || 0) / 100,
        imageUrl: item.productImageUrl,
    })).filter(p => p.id !== 'unknown');

    // 4. Most Clicked Products
    const clicksMap: Record<string, number> = {};
    for (const event of analytics) {
      if (event.productId) {
        clicksMap[event.productId] = (clicksMap[event.productId] || 0) + 1;
      }
    }
    
    // Map clicks to actual product details using the allProducts fetch
    const mostClickedProducts = allProducts
      .map(p => ({
        id: p.id,
        name: p.translations[0]?.name || p.slug,
        slug: p.slug,
        clicks: clicksMap[p.id] || 0,
        imageUrl: p.media[0]?.media?.url || null,
      }))
      .filter(p => p.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // 5. Category Performance
    const categoryMap: Record<string, { name: string; revenue: number; unitsSold: number }> = {};
    
    // Initialize categories
    for (const cat of categories) {
      categoryMap[cat.id] = {
        name: cat.translations[0]?.name || cat.slug,
        revenue: 0,
        unitsSold: 0,
      };
    }
    
    // Calculate from order items
    // Note: To be 100% accurate we need the product->category relation. 
    // We use a helper map from the allProducts fetch.
    const productCategoryMap = new Map<string, string>();
    allProducts.forEach(p => productCategoryMap.set(p.id, p.categoryId));

    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId) {
          const catId = productCategoryMap.get(item.productId);
          if (catId && categoryMap[catId]) {
             categoryMap[catId]!.revenue += item.lineTotalMinor / 100;
             categoryMap[catId]!.unitsSold += item.quantity;
          }
        }
      }
    }
    
    const categoryPerformance = Object.values(categoryMap)
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // 6. Summary Stats
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalMinor / 100, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = allProducts.length;
    const totalClicks = analytics.length;

    // Order status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          totalProducts,
          totalClicks,
        },
        ordersPerMonth,
        revenuePerMonth,
        ordersByWilaya,
        topSellingProducts,
        mostClickedProducts,
        categoryPerformance,
        statusBreakdown,
      },
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}