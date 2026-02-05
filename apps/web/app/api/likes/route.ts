/**
 * Product Likes API Route
 * POST: Toggle like on a product
 * GET: Get like status for a product or batch of products
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';

// Retry wrapper for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 300
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      const isRetryable = lastError.message.includes('Connection terminated') ||
                          lastError.message.includes('timeout') ||
                          lastError.message.includes('connection') ||
                          lastError.message.includes('ECONNRESET');
      
      if (isRetryable && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 30, windowMs = 60000): boolean {
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

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 30, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { productId, fingerprint } = body;

    // Validation
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });
    }

    return withRetry(async () => {
      // Check if product exists
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Check if already liked
      const existingLike = await prisma.productLike.findUnique({
        where: {
          productId_fingerprint: {
            productId,
            fingerprint,
          },
        },
      });

      if (existingLike) {
        // Unlike - remove the like
        await prisma.productLike.delete({
          where: { id: existingLike.id },
        });

        // Update product like count
        await prisma.product.update({
          where: { id: productId },
          data: { likeCount: { decrement: 1 } },
        });

        return NextResponse.json({
          success: true,
          liked: false,
          likeCount: Math.max(0, product.likeCount - 1),
        });
      } else {
        // Like - add new like
        await prisma.productLike.create({
          data: {
            productId,
            fingerprint,
          },
        });

        // Update product like count
        await prisma.product.update({
          where: { id: productId },
          data: { likeCount: { increment: 1 } },
        });

        return NextResponse.json({
          success: true,
          liked: true,
          likeCount: product.likeCount + 1,
        });
      }
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
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
  const productIds = searchParams.get('productIds'); // comma-separated for batch
  const fingerprint = searchParams.get('fingerprint');

  try {
    // BATCH MODE: Multiple product IDs
    if (productIds) {
      const ids = productIds.split(',').filter(id => isValidUUID(id.trim())).map(id => id.trim());
      
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No valid product IDs' }, { status: 400 });
      }
      
      // Limit batch size to prevent abuse
      if (ids.length > 50) {
        return NextResponse.json({ error: 'Too many product IDs (max 50)' }, { status: 400 });
      }

      return withRetry(async () => {
        // Get products with like counts
        const products = await prisma.product.findMany({
          where: {
            id: { in: ids },
            status: 'PUBLISHED',
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, likeCount: true },
        });

        // Get user's likes for these products (if fingerprint provided)
        let userLikes: Set<string> = new Set();
        if (fingerprint) {
          const likes = await prisma.productLike.findMany({
            where: {
              productId: { in: ids },
              fingerprint,
            },
            select: { productId: true },
          });
          userLikes = new Set(likes.map(l => l.productId));
        }

        // Build response map
        const likesMap: Record<string, { likeCount: number; isLiked: boolean }> = {};
        for (const product of products) {
          likesMap[product.id] = {
            likeCount: product.likeCount,
            isLiked: userLikes.has(product.id),
          };
        }

        return NextResponse.json({
          success: true,
          likes: likesMap,
        });
      });
    }

    // SINGLE MODE: One product ID
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    return withRetry(async () => {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
        select: { likeCount: true },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      let isLiked = false;
      if (fingerprint) {
        const existingLike = await prisma.productLike.findUnique({
          where: {
            productId_fingerprint: {
              productId,
              fingerprint,
            },
          },
        });
        isLiked = !!existingLike;
      }

      return NextResponse.json({
        likeCount: product.likeCount,
        isLiked,
      });
    });

  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch like status' },
      { status: 500 }
    );
  }
}
