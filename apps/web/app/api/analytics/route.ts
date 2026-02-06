/**
 * Analytics Tracking API
 * POST: Record analytics events (e.g., product views)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import rateLimit from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const limiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 500 });

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 analytics events per minute per IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    try {
      await limiter.check(30, ip);
    } catch {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const { type, productId, sessionId, path: pagePath } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Only allow specific event types from the client
    const allowedTypes = [
      'VIEW_PRODUCT',
      'PAGE_VIEW',
      'SEARCH',
      'CART_ADD',
      'CART_REMOVE',
      'ADD_TO_WISHLIST',
      'REMOVE_FROM_WISHLIST',
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Validate and sanitize productId (UUID format)
    if (productId && (typeof productId !== 'string' || productId.length > 50)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Sanitize sessionId and path
    const cleanSessionId = typeof sessionId === 'string' ? sessionId.slice(0, 100) : undefined;
    const cleanPath = typeof pagePath === 'string' ? pagePath.slice(0, 255) : undefined;

    // For VIEW_PRODUCT, require productId
    if (type === 'VIEW_PRODUCT' && !productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required for VIEW_PRODUCT events' },
        { status: 400 }
      );
    }

    // Deduplicate: for VIEW_PRODUCT, skip if same session viewed same product in last 30 min
    if (type === 'VIEW_PRODUCT' && cleanSessionId) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existing = await prisma.analyticsEvent.findFirst({
        where: {
          type: 'VIEW_PRODUCT',
          productId,
          sessionId: cleanSessionId,
          occurredAt: { gte: thirtyMinAgo },
        },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json({ success: true, deduplicated: true });
      }
    }

    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || undefined;

    // Hash the IP for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    await prisma.analyticsEvent.create({
      data: {
        type,
        productId: productId || undefined,
        sessionId: cleanSessionId,
        path: cleanPath,
        ipHash,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request - analytics should be fire-and-forget
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
