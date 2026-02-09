/**
 * RIME COUTURE - Toggle Product Visibility API
 * =============================================
 * Toggle product isActive status (hide/show from shopping page)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Locale } from '@repo/db';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const { productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product visibility
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
        translations: {
          where: { locale: 'EN' as Locale },
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        isActive: updatedProduct.isActive,
        name: updatedProduct.translations[0]?.name || 'Product',
      },
    });
  } catch (error) {
    console.error('Toggle product visibility error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product visibility' },
      { status: 500 }
    );
  }
}
