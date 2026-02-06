/**
 * Admin Statistics API Route
 * Fetches aggregated data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

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
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);
    
    // Calculate date range (last N months)
    // End date is now (current date)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all required data in parallel
    const [
      orders,
      products,
      analytics,
      categories,
    ] = await withRetry(() => Promise.all([
      // Orders with items for revenue calculation
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          deletedAt: null,
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
      
      // Products with sales data
      prisma.product.findMany({
        where: {
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
          salesCount: true,
          likeCount: true,
          reviewCount: true,
          avgRating: true,
          basePriceMinor: true,
          categoryId: true,
          translations: {
            where: { locale: 'EN' },
            select: { name: true },
          },
          media: {
            where: { isThumb: true },
            take: 1,
            select: {
              media: {
                select: { url: true },
              },
            },
          },
        },
        orderBy: { salesCount: 'desc' },
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

    // ========== PROCESS DATA ==========

    // 1. Orders & Revenue per month
    const monthlyData: Record<string, { orders: number; revenue: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyData[key] = { orders: 0, revenue: 0 };
    }
    
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyData[key]) {
        monthlyData[key].orders += 1;
        monthlyData[key].revenue += order.totalMinor / 100;
      }
    }

    const ordersPerMonth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      orders: data.orders,
    }));

    const revenuePerMonth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
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
      wilayaMap[key].orders += 1;
      wilayaMap[key].revenue += order.totalMinor / 100;
    }
    
    const ordersByWilaya = Object.values(wilayaMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 15);

    // 3. Top Selling Products
    const topSellingProducts = products
      .filter(p => p.salesCount > 0)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.translations[0]?.name || p.slug,
        slug: p.slug,
        salesCount: p.salesCount,
        revenue: (p.salesCount * p.basePriceMinor) / 100,
        imageUrl: p.media[0]?.media?.url || null,
      }));

    // 4. Most Clicked Products
    const clicksMap: Record<string, number> = {};
    for (const event of analytics) {
      if (event.productId) {
        clicksMap[event.productId] = (clicksMap[event.productId] || 0) + 1;
      }
    }
    
    const mostClickedProducts = products
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

    // 5. Category Performance (revenue and units sold)
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
    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product && categoryMap[product.categoryId]) {
            const cat = categoryMap[product.categoryId];
            if (cat) {
              cat.revenue += item.lineTotalMinor / 100;
              cat.unitsSold += item.quantity;
            }
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
    const totalProducts = products.length;
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
