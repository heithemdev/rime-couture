/**
 * Admin Notification API
 * POST: Send email notifications to subscribed users
 * Types: new-product, discount, order-shipped
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  sendNewProductEmail,
  sendDiscountEmail,
  sendOrderShippedEmail,
  sendBulkEmails,
} from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json({ success: false, error: 'Missing notification type' }, { status: 400 });
    }

    // Get all subscribed users with verified emails
    const subscribers = await prisma.user.findMany({
      where: {
        emailNotifications: true,
        emailVerifiedAt: { not: null },
        deletedAt: null,
        role: 'CLIENT',
      },
      select: { email: true },
    });

    const emails = subscribers.map(u => u.email).filter(Boolean);

    if (emails.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
    }

    if (type === 'new-product') {
      const { productName, productSlug, productImageUrl, productPrice, productDescription } = body;
      if (!productName || !productSlug) {
        return NextResponse.json({ success: false, error: 'Missing product data' }, { status: 400 });
      }

      const result = await sendBulkEmails(emails, (to) =>
        sendNewProductEmail(to, { productName, productSlug, productImageUrl, productPrice, productDescription })
      );

      return NextResponse.json({ success: true, ...result });
    }

    if (type === 'discount') {
      const { productName, productSlug, productImageUrl, originalPrice, newPrice, discountPercent } = body;
      if (!productName || !productSlug || !discountPercent) {
        return NextResponse.json({ success: false, error: 'Missing discount data' }, { status: 400 });
      }

      const result = await sendBulkEmails(emails, (to) =>
        sendDiscountEmail(to, { productName, productSlug, productImageUrl, originalPrice, newPrice, discountPercent })
      );

      return NextResponse.json({ success: true, ...result });
    }

    if (type === 'order-shipped') {
      const { orderNumber, customerName, customerEmail, trackingCode } = body;
      if (!orderNumber || !customerEmail) {
        return NextResponse.json({ success: false, error: 'Missing order data' }, { status: 400 });
      }

      await sendOrderShippedEmail(customerEmail, { orderNumber, customerName, trackingCode });
      return NextResponse.json({ success: true, sent: 1 });
    }

    return NextResponse.json({ success: false, error: 'Unknown notification type' }, { status: 400 });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notifications' }, { status: 500 });
  }
}