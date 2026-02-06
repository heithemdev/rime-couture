/**
 * RIME COUTURE - Admin Orders API
 * =================================
 * GET: Fetch all orders for admin management
 * PATCH: Update order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Locale, Prisma } from '@repo/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all orders for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.OrderWhereInput = {};
    
    if (status && status !== 'ALL') {
      where.status = status as Prisma.EnumOrderStatusFilter['equals'];
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch total count
    const totalCount = await prisma.order.count({ where });

    // Build orderBy
    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [sortBy]: sortOrder as Prisma.SortOrder
    };

    // Fetch orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      where: { isThumb: true },
                      include: { media: true },
                      take: 1,
                    },
                    translations: {
                      where: { locale: 'EN' as Locale },
                    },
                  },
                },
                size: {
                  include: {
                    translations: {
                      where: { locale: 'EN' as Locale },
                    },
                  },
                },
                color: {
                  include: {
                    translations: {
                      where: { locale: 'EN' as Locale },
                    },
                  },
                },
              },
            },
          },
        },
        shipment: {
          select: {
            status: true,
            trackingCode: true,
            provider: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format orders - customer/address fields are directly on Order model
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotalMinor / 100,
      shipping: order.shippingMinor / 100,
      total: order.totalMinor / 100,
      // Customer info is directly on Order model
      customerName: order.customerName || 'Unknown',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      // Address info is directly on Order model
      addressLine1: order.addressLine1 || '',
      addressLine2: order.addressLine2 || '',
      wilayaCode: order.wilayaCode,
      wilayaName: order.wilayaName || '',
      commune: order.commune || '',
      customerNote: order.customerNote,
      createdAt: order.createdAt.toISOString(),
      confirmedAt: order.confirmedAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      canceledAt: order.canceledAt?.toISOString() || null,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.variant?.product?.id || item.productId,
        productName: item.productName || item.variant?.product?.translations[0]?.name || 'Unknown Product',
        productSlug: item.productSlug || item.variant?.product?.slug,
        productImageUrl: item.productImageUrl || item.variant?.product?.media[0]?.media?.url || null,
        quantity: item.quantity,
        unitPrice: item.unitPriceMinor / 100,
        lineTotal: item.lineTotalMinor / 100,
        sizeLabel: item.sizeLabel || item.variant?.size?.translations[0]?.label || item.variant?.size?.code || null,
        colorLabel: item.colorLabel || item.variant?.color?.translations[0]?.label || item.variant?.color?.code || null,
        colorHex: item.variant?.color?.hex || null,
      })),
      shipment: order.shipment
        ? {
            status: order.shipment.status,
            trackingCode: order.shipment.trackingCode,
            provider: order.shipment.provider,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, trackingCode } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'SHIPPING',
      'DELIVERED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: Prisma.OrderUpdateInput = { status };

    // Set timestamp based on status
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'SHIPPING') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // If shipping, update or create shipment with tracking code
    if (status === 'SHIPPING' && trackingCode) {
      await prisma.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          status: 'IN_TRANSIT',
          trackingCode: trackingCode || null,
        },
        update: {
          status: 'IN_TRANSIT',
          trackingCode: trackingCode || undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
