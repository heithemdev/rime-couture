//apps/web/app/api/reviews/route.ts

/**
 * Reviews API Route
 * POST: Create a new review (one per fingerprint per product)
 * PUT: Update an existing review
 * GET: Fetch reviews for a product
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
      console.log(`[Reviews API] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Validate UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Sanitize text input
function sanitizeText(text: string, maxLength = 1000): string {
  return text
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Rate limiting - 5 review posts per minute
  if (!checkRateLimit(clientIp, 5, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { productId, rating, title, comment, reviewerName, fingerprint } = body;

    // Validation
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if product exists
    const product = await withRetry(() => prisma.product.findFirst({
      where: {
        id: productId,
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      },
    }));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product (by fingerprint)
    const existingReview = await withRetry(() => prisma.review.findUnique({
      where: {
        productId_fingerprint: {
          productId,
          fingerprint,
        },
      },
    }));

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }

    // Create review
    const review = await withRetry(() => prisma.review.create({
      data: {
        productId,
        rating,
        title: title ? sanitizeText(title, 200) : null,
        comment: comment ? sanitizeText(comment, 2000) : null,
        reviewerName: reviewerName ? sanitizeText(reviewerName, 50) : 'Anonymous',
        fingerprint,
      },
    }));

    // Update product stats
    const reviewStats = await withRetry(() => prisma.review.aggregate({
      where: {
        productId,
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { id: true },
    }));

    await withRetry(() => prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: reviewStats._avg.rating || 0,
        reviewCount: reviewStats._count.id,
      },
    }));

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        reviewerName: review.reviewerName,
        createdAt: review.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 60, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const fingerprint = searchParams.get('fingerprint');

  if (!productId || !isValidUUID(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const reviews = await withRetry(() => prisma.review.findMany({
      where: {
        productId,
        isHidden: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        reviewerName: true,
        createdAt: true,
      },
    }));

    // Check if user has already reviewed
    let hasReviewed = false;
    let userReview = null;
    if (fingerprint) {
      const existingReview = await withRetry(() => prisma.review.findUnique({
        where: {
          productId_fingerprint: {
            productId,
            fingerprint,
          },
        },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          reviewerName: true,
          createdAt: true,
        },
      }));
      hasReviewed = !!existingReview;
      userReview = existingReview;
    }

    return NextResponse.json({
      reviews,
      hasReviewed,
      userReview,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing review
export async function PUT(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Rate limiting - 5 review updates per minute
  if (!checkRateLimit(clientIp, 5, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { productId, rating, title, comment, reviewerName, fingerprint } = body;

    // Validation
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Find existing review
    const existingReview = await withRetry(() => prisma.review.findUnique({
      where: {
        productId_fingerprint: {
          productId,
          fingerprint,
        },
      },
    }));

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found. You have not reviewed this product yet.' },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await withRetry(() => prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        title: title ? sanitizeText(title, 200) : null,
        comment: comment ? sanitizeText(comment, 2000) : null,
        reviewerName: reviewerName ? sanitizeText(reviewerName, 50) : 'Anonymous',
      },
    }));

    // Update product stats
    const reviewStats = await withRetry(() => prisma.review.aggregate({
      where: {
        productId,
        isHidden: false,
      },
      _avg: { rating: true },
      _count: { id: true },
    }));

    await withRetry(() => prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: reviewStats._avg.rating || 0,
        reviewCount: reviewStats._count.id,
      },
    }));

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        title: updatedReview.title,
        comment: updatedReview.comment,
        reviewerName: updatedReview.reviewerName,
        createdAt: updatedReview.createdAt,
      },
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
