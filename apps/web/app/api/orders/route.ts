//apps/web/app/api/orders/route.ts
/**
 * Orders API Route
 * Secure, rate-limited order creation for checkout
 * Supports fingerprint-based user identification
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, OrderStatus, PaymentStatus, Locale } from '@repo/db';
import {
  checkRateLimit,
  rateLimitResponse,
  checkForBot,
} from '@/lib/api-security';
import { sendOrderReceiptEmail } from '@/lib/email';

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
      console.log(`[Orders API] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RC-${timestamp}-${random}`;
}

// Validate Algerian phone number
function isValidAlgerianPhone(phone: string): boolean {
  return /^(05|06|07)\d{8}$/.test(phone);
}

interface OrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice?: number;
}

interface OrderInput {
  // Customer info
  customerName: string;
  phone: string;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  address?: string;
  notes?: string;
  
  // Delivery
  deliveryType: 'HOME' | 'DESK';
  shippingPrice: number;
  
  // Items - either single product or cart items
  productId?: string;
  variantId?: string;
  quantity?: number;
  items?: OrderItemInput[];
  
  // User identification (fingerprint)
  fingerprint?: string;
}

// GET - Fetch orders by fingerprint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');

    if (!fingerprint || fingerprint.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid fingerprint' },
        { status: 400 }
      );
    }

    // Fetch orders with the given fingerprint (stored in sessionId)
    const orders = await withRetry(() => prisma.order.findMany({
      where: {
        sessionId: fingerprint,
        deletedAt: null,
      },
      include: {
        items: true,
        shipment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }));

    // Transform orders for the frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotalMinor / 100,
      shipping: order.shippingMinor / 100,
      total: order.totalMinor / 100,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      addressLine1: order.addressLine1,
      wilayaName: order.wilayaName,
      commune: order.commune,
      customerNote: order.customerNote,
      createdAt: order.createdAt.toISOString(),
      confirmedAt: order.confirmedAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSlug: item.productSlug,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        unitPrice: item.unitPriceMinor / 100,
        lineTotal: item.lineTotalMinor / 100,
        sizeLabel: item.sizeLabel,
        colorLabel: item.colorLabel,
      })),
      shipment: order.shipment
        ? {
            status: order.shipment.status,
            trackingCode: order.shipment.trackingCode,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ========== SECURITY CHECKS ==========
    
    // Rate limiting (10 orders per minute per IP - stricter for orders)
    const rateLimit = checkRateLimit(request, {
      windowMs: 60000,
      maxRequests: 10,
      keyPrefix: 'orders',
    });
    
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }
    
    // Bot detection
    const botCheck = checkForBot(request);
    if (botCheck.isSuspicious) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // ========== PARSE & VALIDATE INPUT ==========
    
    let body: OrderInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const {
      customerName,
      phone,
      wilayaCode,
      wilayaName,
      commune,
      address,
      notes,
      deliveryType,
      shippingPrice,
      productId,
      variantId,
      quantity,
      items,
      fingerprint,
    } = body;
    
    // Validate required fields
    if (!customerName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }
    
    if (!phone || !isValidAlgerianPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Valid Algerian phone number is required (05/06/07)' },
        { status: 400 }
      );
    }
    
    if (!wilayaCode || !wilayaName) {
      return NextResponse.json(
        { success: false, error: 'Wilaya is required' },
        { status: 400 }
      );
    }
    
    if (!commune) {
      return NextResponse.json(
        { success: false, error: 'Commune/Baladiya is required' },
        { status: 400 }
      );
    }
    
    if (deliveryType === 'HOME' && !address?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Delivery address is required for home delivery' },
        { status: 400 }
      );
    }
    
    // Determine order items
    let orderItems: OrderItemInput[] = [];
    
    if (items && Array.isArray(items) && items.length > 0) {
      // Cart checkout - multiple items
      orderItems = items.filter(item => item.productId && item.quantity > 0);
    } else if (productId && quantity && quantity > 0) {
      // Single product checkout
      orderItems = [{
        productId,
        variantId,
        quantity,
      }];
    }
    
    if (orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one product is required' },
        { status: 400 }
      );
    }
    
    // ========== VALIDATE PRODUCTS & STOCK ==========
    
    const productIds = [...new Set(orderItems.map(item => item.productId))];
    const variantIds = orderItems
      .filter(item => item.variantId)
      .map(item => item.variantId!) as string[];
    
    // Fetch products with their variants
    const products = await withRetry(() => prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: 'EN' },
        },
        media: {
          where: { isThumb: true },
          take: 1,
          include: {
            media: true,
          },
        },
        variants: {
          where: variantIds.length > 0 ? { id: { in: variantIds } } : undefined,
          include: {
            size: true,
            color: true,
          },
        },
      },
    }));
    
    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Validate each item
    let subtotalMinor = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
      productName: string;
      productSlug: string;
      productImageUrl: string | null;
      sizeLabel: string | null;
      colorLabel: string | null;
    }> = [];
    
    for (const item of orderItems) {
      const product = productMap.get(item.productId);
      
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found or unavailable` },
          { status: 400 }
        );
      }
      
      let unitPriceMinor = product.basePriceMinor;
      let stock = 999; // Default high stock for products without variants
      let sizeLabel: string | null = null;
      let colorLabel: string | null = null;
      
      // Check variant if specified
      if (item.variantId && product.variants) {
        const variant = (product.variants as Array<{
          id: string;
          priceMinor: number | null;
          stock: number;
          size?: { label: string } | null;
          color?: { label: string } | null;
        }>).find(v => v.id === item.variantId);
        
        if (!variant) {
          return NextResponse.json(
            { success: false, error: `Variant not found for ${product.translations[0]?.name || product.slug}` },
            { status: 400 }
          );
        }
        
        // Use variant price if available
        if (variant.priceMinor !== null) {
          unitPriceMinor = variant.priceMinor;
        }
        
        stock = variant.stock;
        sizeLabel = variant.size?.label || null;
        colorLabel = variant.color?.label || null;
      }
      
      // Check stock
      if (stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.translations[0]?.name || product.slug}` },
          { status: 400 }
        );
      }
      
      const lineTotalMinor = unitPriceMinor * item.quantity;
      subtotalMinor += lineTotalMinor;
      
      validatedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPriceMinor,
        lineTotalMinor,
        productName: product.translations[0]?.name || product.slug,
        productSlug: product.slug,
        productImageUrl: product.media[0]?.media?.url || null,
        sizeLabel,
        colorLabel,
      });
    }
    
    // ========== CREATE ORDER ==========
    
    const shippingMinor = Math.round((shippingPrice || 0) * 100);
    const totalMinor = subtotalMinor + shippingMinor;
    
    const order = await withRetry(() => prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        checkoutLocale: 'EN' as Locale,
        currency: 'DZD',
        status: 'PENDING' as OrderStatus,
        paymentStatus: 'PENDING' as PaymentStatus,
        
        subtotalMinor,
        shippingMinor,
        totalMinor,
        
        customerName: customerName.trim(),
        customerPhone: phone,
        addressLine1: deliveryType === 'HOME' ? address!.trim() : `Desk Pickup - ${commune}`,
        wilayaCode: parseInt(wilayaCode, 10),
        wilayaName,
        commune,
        customerNote: notes?.trim() || null,
        
        // Store fingerprint for user identification
        sessionId: fingerprint || null,
        
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            lineTotalMinor: item.lineTotalMinor,
            productName: item.productName,
            productSlug: item.productSlug,
            productImageUrl: item.productImageUrl,
            sizeLabel: item.sizeLabel,
            colorLabel: item.colorLabel,
          })),
        },
      },
      include: {
        items: true,
      },
    }));
    
    // ========== UPDATE STOCK ==========
    
    for (const item of validatedItems) {
      if (item.variantId) {
        await withRetry(() => prisma.productVariant.update({
          where: { id: item.variantId! },
          data: {
            stock: { decrement: item.quantity },
          },
        }));
      }
    }
    
    // ========== SEND ORDER RECEIPT EMAIL (fire & forget) ==========
    
    if (order.customerEmail || fingerprint) {
      // Try to find user email from fingerprint → session → user
      let recipientEmail = order.customerEmail;
      if (!recipientEmail && fingerprint) {
        try {
          // Look up user by fingerprint from their ProductLike records
          const likeRecord = await prisma.productLike.findFirst({
            where: { fingerprint, userId: { not: null } },
            include: { user: { select: { email: true, emailNotifications: true } } },
          });
          if (likeRecord?.user?.emailNotifications && likeRecord.user.email) {
            recipientEmail = likeRecord.user.email;
          }
        } catch { /* ignore */ }
      }
      
      if (recipientEmail) {
        sendOrderReceiptEmail(recipientEmail, {
          orderNumber: order.orderNumber,
          customerName: customerName.trim(),
          items: validatedItems.map(item => ({
            productName: item.productName,
            productSlug: item.productSlug,
            productImageUrl: item.productImageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPriceMinor / 100,
            lineTotal: item.lineTotalMinor / 100,
            sizeLabel: item.sizeLabel,
            colorLabel: item.colorLabel,
          })),
          subtotal: subtotalMinor / 100,
          shipping: shippingMinor / 100,
          total: totalMinor / 100,
          wilayaName,
          commune,
          address: deliveryType === 'HOME' ? address?.trim() : undefined,
        }).catch(err => console.error('Failed to send order receipt email:', err));
      }
    }
    
    // ========== RETURN SUCCESS ==========
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: totalMinor / 100,
        itemCount: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
