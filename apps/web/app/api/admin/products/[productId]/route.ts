/**
 * RIME COUTURE - Admin Single Product API
 * ========================================
 * GET: Fetch product details for editing
 * PUT: Update product
 * DELETE: Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma, Locale } from '@repo/db';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function saveUploadedFile(file: File): Promise<{ url: string; mimeType: string; bytes: number; kind: 'IMAGE' | 'VIDEO' }> {
  const mimeType = file.type || 'application/octet-stream';
  const kind: 'IMAGE' | 'VIDEO' = mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE';

  const extFromName = path.extname(file.name || '');
  const ext = extFromName || (kind === 'VIDEO' ? '.mp4' : '.jpg');
  const filename = `${crypto.randomUUID()}${ext}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(uploadDir, filename);
  await writeFile(fullPath, bytes);

  return {
    url: `/uploads/${filename}`,
    mimeType,
    bytes: bytes.length,
    kind,
  };
}

function generateSku(productId: string, index: number) {
  return `RC-${productId.slice(0, 8)}-${String(index + 1).padStart(3, '0')}-${crypto.randomUUID().slice(0, 6)}`;
}

// GET - Fetch product details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        variants: true,
        media: {
          include: {
            media: true,
          },
          orderBy: { position: 'asc' },
        },
        tags: { 
          include: { 
            tag: {
              include: {
                translations: {
                  where: { locale: 'EN' as Locale },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const formattedProduct = {
      id: product.id,
      slug: product.slug,
      categoryId: product.categoryId,
      basePriceMinor: product.basePriceMinor,
      isActive: product.isActive,
      status: product.status,
      translations: product.translations.map((t) => ({
        locale: t.locale.toLowerCase(),
        name: t.name,
        description: t.description || '',
        seoTitle: t.seoTitle || '',
        seoDescription: t.seoDescription || '',
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        priceMinor: v.priceMinor || product.basePriceMinor,
        stock: v.stock,
        variantKey: v.variantKey,
        sizeId: v.sizeId,
        colorId: v.colorId,
      })),
      media: product.media.map((m) => ({
        id: m.id,
        url: m.media?.url || '',
        kind: m.media?.kind === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        isThumb: m.isThumb,
        position: m.position,
        colorId: m.colorId || null,
      })),
      tags: product.tags.map((t) => ({
        id: t.tag.id,
        type: t.tag.type,
        slug: t.tag.slug,
        label: t.tag.translations[0]?.label || t.tag.slug,
      })),
    };

    return NextResponse.json({ success: true, data: formattedProduct });
  } catch (error) {
    console.error('Admin get product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    // Parse form data (for file uploads)
    const formData = await request.formData();
    const dataStr = formData.get('data') as string;
    
    if (!dataStr) {
      return NextResponse.json(
        { success: false, error: 'Missing product data' },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataStr);

    // Verify product exists
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product within transaction
    const updatedProduct = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update main product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          slug: data.slug,
          categoryId: data.categoryId,
          basePriceMinor: data.basePriceMinor,
          isActive: data.isActive,
          status: data.status,
        },
      });

      // Update translations
      if (data.translations?.length > 0) {
        for (const t of data.translations) {
          const locale = t.locale.toUpperCase() as Locale;
          await tx.productTranslation.upsert({
            where: { productId_locale: { productId, locale } },
            create: {
              productId,
              locale,
              name: t.name,
              description: t.description || '',
              seoTitle: t.seoTitle || null,
              seoDescription: t.seoDescription || null,
            },
            update: {
              name: t.name,
              description: t.description || '',
              seoTitle: t.seoTitle || null,
              seoDescription: t.seoDescription || null,
            },
          });
        }
      }

      // Handle variants (size/color aware, auto SKU if missing)
      if (Array.isArray(data.variants)) {
        // Delete removed variants
        const variantIds = data.variants
          .map((v: { id?: string }) => v.id)
          .filter((id: unknown) => typeof id === 'string' && !id.startsWith('temp-')) as string[];
        
        await tx.productVariant.deleteMany({
          where: { productId, id: { notIn: variantIds } },
        });

        // Update/create variants
        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i];
          const hasDbId = typeof v.id === 'string' && !v.id.startsWith('temp-');
          const sizeId = v.sizeId ?? null;
          const colorId = v.colorId ?? null;
          const variantKey = `${colorId || 'no-color'}:${sizeId || 'no-size'}`;

          if (hasDbId) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                // keep existing sku if not provided
                sku: typeof v.sku === 'string' && v.sku.trim() ? v.sku.trim() : undefined,
                variantKey,
                sizeId,
                colorId,
                priceMinor: v.priceMinor ?? undefined,
                stock: v.stock ?? undefined,
              },
            });
          } else {
            const sku = typeof v.sku === 'string' && v.sku.trim() ? v.sku.trim() : generateSku(productId, i);
            await tx.productVariant.create({
              data: {
                productId,
                variantKey,
                sku,
                sizeId,
                colorId,
                priceMinor: v.priceMinor ?? data.basePriceMinor,
                stock: v.stock ?? 0,
              },
            });
          }
        }
      }

      // Handle media (existing updates + new uploads)
      if (Array.isArray(data.media)) {
        const keepIds = data.media
          .map((m: { id?: string; uploadKey?: string }) => m)
          .filter((m: { id?: string; uploadKey?: string }) => typeof m.id === 'string' && !m.id.startsWith('temp-') && !m.uploadKey)
          .map((m: { id: string }) => m.id);

        // Remove links not present anymore
        await tx.productMedia.deleteMany({
          where: {
            productId,
            id: { notIn: keepIds },
          },
        });

        // Move existing links to temp positions first (avoid unique constraint collisions)
        for (let i = 0; i < keepIds.length; i++) {
          await tx.productMedia.update({
            where: { id: keepIds[i]! },
            data: { position: 10000 + i, isThumb: false },
          });
        }

        // Create new uploads
        for (let i = 0; i < data.media.length; i++) {
          const m = data.media[i];
          const uploadKey = m.uploadKey as string | undefined;
          if (!uploadKey) continue;

          const file = formData.get(uploadKey);
          if (!(file instanceof File)) continue;

          const saved = await saveUploadedFile(file);

          const asset = await tx.mediaAsset.create({
            data: {
              kind: saved.kind,
              url: saved.url,
              mimeType: saved.mimeType,
              bytes: saved.bytes,
              provider: 'LOCAL',
              meta: { originalName: file.name },
            },
          });

          await tx.productMedia.create({
            data: {
              productId,
              mediaId: asset.id,
              colorId: typeof m.colorId === 'string' && m.colorId.length > 0 ? m.colorId : null,
              position: typeof m.position === 'number' ? m.position : i,
              isThumb: Boolean(m.isThumb),
            },
          });
        }

        // Apply final positions/thumb flags for kept media
        for (const m of data.media) {
          if (typeof m.id !== 'string' || m.id.startsWith('temp-') || m.uploadKey) continue;
          await tx.productMedia.update({
            where: { id: m.id },
            data: {
              position: typeof m.position === 'number' ? m.position : 0,
              isThumb: Boolean(m.isThumb),
              colorId: typeof m.colorId === 'string' && m.colorId.length > 0 ? m.colorId : null,
            },
          });
        }

        // Ensure at least one thumbnail
        const hasThumb = await tx.productMedia.findFirst({
          where: { productId, isThumb: true },
          select: { id: true },
        });
        if (!hasThumb) {
          const first = await tx.productMedia.findFirst({
            where: { productId },
            orderBy: { position: 'asc' },
            select: { id: true },
          });
          if (first) {
            await tx.productMedia.update({ where: { id: first.id }, data: { isThumb: true } });
          }
        }
      }

      // Handle tags (delete old, create new)
      if (Array.isArray(data.tags)) {
        await tx.productTag.deleteMany({ where: { productId } });

        for (const tagId of data.tags) {
          if (typeof tagId === 'string' && tagId.length > 0) {
            await tx.productTag.create({
              data: { productId, tagId },
            });
          }
        }
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      data: { id: updatedProduct.id },
    });
  } catch (error) {
    console.error('Admin update product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // Verify product exists
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
