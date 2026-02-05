/**
 * Cart API Route
 * Full cart management with guest token support
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { randomUUID } from 'crypto';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
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

// Retry wrapper for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Check if it's a connection/timeout error worth retrying
      const isRetryable = lastError.message.includes('Connection terminated') ||
                          lastError.message.includes('timeout') ||
                          lastError.message.includes('connection') ||
                          lastError.message.includes('ECONNRESET') ||
                          lastError.message.includes('ETIMEDOUT');
      
      if (isRetryable && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[cart] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Get or create cart
async function getOrCreateCart(guestToken: string | null) {
  return withRetry(async () => {
    if (guestToken) {
      const existingCart = await prisma.cart.findUnique({
        where: { guestToken },
        include: {
          items: {
            include: {
              product: {
                include: {
                  translations: true,
                  media: {
                    include: { media: true },
                    where: { isThumb: true },
                    take: 1,
                  },
                },
              },
              variant: {
                include: {
                  size: { include: { translations: true } },
                  color: { include: { translations: true } },
                },
              },
            },
          },
        },
      });

      if (existingCart) {
        return existingCart;
      }
    }

    // Create new cart with guest token
    const newToken = guestToken || randomUUID();
    const newCart = await prisma.cart.create({
      data: {
        guestToken: newToken,
        currency: 'DZD',
        locale: 'AR',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: {
                  include: { media: true },
                  where: { isThumb: true },
                  take: 1,
                },
              },
            },
            variant: {
              include: {
                size: { include: { translations: true } },
                color: { include: { translations: true } },
              },
            },
          },
        },
      },
    });

    return newCart;
  });
}

// Format cart response
function formatCartResponse(cart: Awaited<ReturnType<typeof getOrCreateCart>>, locale = 'EN') {
  const localeUpper = locale.toUpperCase();
  
  const items = cart.items.map((item) => {
    const productTranslation = item.product.translations.find(
      (t) => t.locale === localeUpper
    ) || item.product.translations[0];

    const sizeTranslation = item.variant.size?.translations.find(
      (t) => t.locale === localeUpper
    ) || item.variant.size?.translations[0];

    const colorTranslation = item.variant.color?.translations.find(
      (t) => t.locale === localeUpper
    ) || item.variant.color?.translations[0];

    const thumbMedia = item.product.media[0]?.media;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPriceMinor,
      lineTotal: item.unitPriceMinor * item.quantity,
      product: {
        name: productTranslation?.name || 'Unknown Product',
        slug: item.product.slug,
        imageUrl: thumbMedia?.url || null,
      },
      variant: {
        size: sizeTranslation ? {
          code: item.variant.size?.code,
          label: sizeTranslation.label,
        } : null,
        color: colorTranslation ? {
          code: item.variant.color?.code,
          label: colorTranslation.label,
          hex: item.variant.color?.hex,
        } : null,
      },
      stock: item.variant.stock,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart.id,
    guestToken: cart.guestToken,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
  };
}

// GET - Fetch cart
export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 60, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get('guestToken');
  const locale = searchParams.get('locale') || 'EN';

  try {
    const cart = await getOrCreateCart(guestToken);
    return NextResponse.json(formatCartResponse(cart, locale));
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 30, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { guestToken, productId, variantId, quantity = 1, locale = 'EN' } = body;

    // Validation
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (!variantId || !isValidUUID(variantId)) {
      return NextResponse.json({ error: 'Invalid variant ID' }, { status: 400 });
    }

    if (quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Verify variant exists and has stock
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        isActive: true,
        product: {
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        product: {
          select: {
            basePriceMinor: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', availableStock: variant.stock },
        { status: 400 }
      );
    }

    // Use variant price if available, otherwise use product base price
    const unitPrice = variant.priceMinor ?? variant.product.basePriceMinor ?? 0;

    // Get or create cart
    const cart = await getOrCreateCart(guestToken);

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > variant.stock) {
        return NextResponse.json(
          { error: 'Insufficient stock', availableStock: variant.stock },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          // Also update unit price in case it changed
          unitPriceMinor: unitPrice,
        },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          unitPriceMinor: unitPrice,
        },
      });
    }

    // Refetch cart with updated items
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: {
                  include: { media: true },
                  where: { isThumb: true },
                  take: 1,
                },
              },
            },
            variant: {
              include: {
                size: { include: { translations: true } },
                color: { include: { translations: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ...formatCartResponse(updatedCart!, locale),
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 30, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { guestToken, itemId, quantity, locale = 'EN' } = body;

    if (!itemId || !isValidUUID(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    if (quantity < 0 || quantity > 99) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { guestToken },
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Check stock
      if (quantity > cartItem.variant.stock) {
        return NextResponse.json(
          { error: 'Insufficient stock', availableStock: cartItem.variant.stock },
          { status: 400 }
        );
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    // Refetch cart
    const updatedCart = await prisma.cart.findFirst({
      where: { guestToken },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: {
                  include: { media: true },
                  where: { isThumb: true },
                  take: 1,
                },
              },
            },
            variant: {
              include: {
                size: { include: { translations: true } },
                color: { include: { translations: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ...formatCartResponse(updatedCart!, locale),
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, 30, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get('guestToken');
  const itemId = searchParams.get('itemId');
  const locale = searchParams.get('locale') || 'EN';

  if (!itemId || !isValidUUID(itemId)) {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  try {
    // Verify item belongs to cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { guestToken },
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Refetch cart
    const updatedCart = await prisma.cart.findFirst({
      where: { guestToken },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: {
                  include: { media: true },
                  where: { isThumb: true },
                  take: 1,
                },
              },
            },
            variant: {
              include: {
                size: { include: { translations: true } },
                color: { include: { translations: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ...formatCartResponse(updatedCart!, locale),
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
