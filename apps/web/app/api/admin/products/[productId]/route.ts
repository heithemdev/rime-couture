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
import {
  CATEGORY_SLUG_MAP,
  COLOR_CODE_MAP,
  COLOR_HEX_MAP,
  SIZE_CODE_MAP,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// RESOLVE HELPERS
// ============================================================================

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function resolveCategoryId(tx: Prisma.TransactionClient, frontendId: string): Promise<string> {
  if (isUUID(frontendId)) return frontendId;
  const slug = CATEGORY_SLUG_MAP[frontendId] || frontendId;
  let category = await tx.category.findUnique({ where: { slug }, select: { id: true } });
  if (!category) {
    const name = slug === 'kids-clothes' ? 'Kids Clothes' : slug === 'kitchen-stuff' ? 'Kitchen Stuff' : slug;
    category = await tx.category.create({
      data: {
        slug, sortOrder: slug === 'kids-clothes' ? 1 : 2, isActive: true,
        translations: { create: [
          { locale: 'EN' as Locale, name },
          { locale: 'AR' as Locale, name },
          { locale: 'FR' as Locale, name },
        ] },
      },
      select: { id: true },
    });
  }
  return category.id;
}

async function resolveColorId(tx: Prisma.TransactionClient, frontendId: string): Promise<string> {
  if (isUUID(frontendId)) return frontendId;
  const code = COLOR_CODE_MAP[frontendId] || frontendId;
  const hex = COLOR_HEX_MAP[frontendId] || '#888888';
  const color = await tx.color.findUnique({ where: { code }, select: { id: true, hex: true } });
  if (color) {
    if (!color.hex || color.hex === '#888888' || color.hex !== hex) {
      await tx.color.update({ where: { code }, data: { hex } });
    }
    return color.id;
  }
  const created = await tx.color.create({
    data: {
      code, hex, isActive: true,
      translations: { create: [
        { locale: 'EN' as Locale, label: code.charAt(0).toUpperCase() + code.slice(1) },
        { locale: 'AR' as Locale, label: code },
        { locale: 'FR' as Locale, label: code },
      ] },
    },
    select: { id: true },
  });
  return created.id;
}

async function resolveSizeId(tx: Prisma.TransactionClient, frontendId: string): Promise<string> {
  if (isUUID(frontendId)) return frontendId;
  const code = SIZE_CODE_MAP[frontendId] || frontendId;
  let size = await tx.size.findUnique({ where: { code }, select: { id: true } });
  if (!size) {
    const num = code.replace(/\D/g, '');
    size = await tx.size.create({
      data: {
        code, sortOrder: parseInt(num) || 0, isActive: true,
        translations: { create: [
          { locale: 'EN' as Locale, label: `${num} Years` },
          { locale: 'AR' as Locale, label: `${num} سنوات` },
          { locale: 'FR' as Locale, label: `${num} Ans` },
        ] },
      },
      select: { id: true },
    });
  }
  return size.id;
}

async function resolveOrCreateTag(tx: Prisma.TransactionClient, slug: string, type: 'MATERIAL' | 'PATTERN' | 'OCCASION'): Promise<string> {
  const existing = await tx.tag.findUnique({ where: { type_slug: { type, slug } }, select: { id: true } });
  if (existing) return existing.id;
  const label = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  const created = await tx.tag.create({
    data: {
      type, slug, isActive: true,
      translations: { create: [
        { locale: 'EN' as Locale, label },
        { locale: 'AR' as Locale, label },
        { locale: 'FR' as Locale, label },
      ] },
    },
    select: { id: true },
  });
  return created.id;
}

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
        category: { select: { slug: true } },
        variants: {
          include: {
            size: { select: { id: true, code: true } },
            color: { select: { id: true, code: true, hex: true } },
          },
        },
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

    // Separate tags by type into materials and patterns
    const materials: string[] = [];
    const patterns: string[] = [];
    const tagsList: { id: string; type: string; slug: string; label: string }[] = [];

    for (const t of product.tags) {
      const tag = t.tag;
      const label = tag.translations[0]?.label || tag.slug;
      tagsList.push({ id: tag.id, type: tag.type, slug: tag.slug, label });

      if (tag.type === 'MATERIAL') {
        materials.push(label);
      } else if (tag.type === 'PATTERN') {
        patterns.push(label);
      }
    }

    const formattedProduct = {
      id: product.id,
      slug: product.slug,
      categoryId: product.categoryId,
      categorySlug: product.category?.slug || null,
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
        sizeCode: v.size?.code || null,
        colorCode: v.color?.code || null,
      })),
      media: product.media.map((m) => ({
        id: m.id,
        url: m.media?.url || '',
        kind: m.media?.kind === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        isThumb: m.isThumb,
        position: m.position,
        colorId: m.colorId || null,
      })),
      tags: tagsList,
      materials,
      patterns,
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
      // Resolve category ID (might be frontend ID like 'cat-kids-clothes')
      const realCategoryId = data.categoryId ? await resolveCategoryId(tx, data.categoryId) : undefined;

      // Resolve all color IDs from variants
      const colorIdMap = new Map<string, string>();
      if (Array.isArray(data.variants)) {
        for (const v of data.variants) {
          if (v.colorId && typeof v.colorId === 'string' && !colorIdMap.has(v.colorId)) {
            colorIdMap.set(v.colorId, await resolveColorId(tx, v.colorId));
          }
        }
      }
      // Also resolve colors from media
      if (Array.isArray(data.media)) {
        for (const m of data.media) {
          if (m.colorId && typeof m.colorId === 'string' && !colorIdMap.has(m.colorId)) {
            colorIdMap.set(m.colorId, await resolveColorId(tx, m.colorId));
          }
        }
      }

      // Resolve all size IDs
      const sizeIdMap = new Map<string, string>();
      if (Array.isArray(data.variants)) {
        for (const v of data.variants) {
          if (v.sizeId && typeof v.sizeId === 'string' && !sizeIdMap.has(v.sizeId)) {
            sizeIdMap.set(v.sizeId, await resolveSizeId(tx, v.sizeId));
          }
        }
      }

      // Update main product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          slug: data.slug,
          categoryId: realCategoryId,
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
          const sizeId = v.sizeId ? (sizeIdMap.get(v.sizeId) || v.sizeId) : null;
          const colorId = v.colorId ? (colorIdMap.get(v.colorId) || v.colorId) : null;
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
              colorId: typeof m.colorId === 'string' && m.colorId.length > 0 ? (colorIdMap.get(m.colorId) || m.colorId) : null,
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
              colorId: typeof m.colorId === 'string' && m.colorId.length > 0 ? (colorIdMap.get(m.colorId) || m.colorId) : null,
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

      // Handle tags (delete old, create new — including materials & patterns)
      await tx.productTag.deleteMany({ where: { productId } });

      const tagIds: string[] = [];

      // Existing tag IDs
      if (Array.isArray(data.tags)) {
        for (const tagId of data.tags) {
          if (typeof tagId === 'string' && tagId.length > 0) {
            tagIds.push(tagId);
          }
        }
      }

      // Materials → resolve/create as MATERIAL tags
      if (Array.isArray(data.materials)) {
        for (const mat of data.materials) {
          if (typeof mat === 'string' && mat.trim()) {
            tagIds.push(await resolveOrCreateTag(tx, mat.trim().toLowerCase().replace(/\s+/g, '-'), 'MATERIAL'));
          }
        }
      }

      // Patterns → resolve/create as PATTERN tags
      if (Array.isArray(data.patterns)) {
        for (const pat of data.patterns) {
          if (typeof pat === 'string' && pat.trim()) {
            tagIds.push(await resolveOrCreateTag(tx, pat.trim().toLowerCase().replace(/\s+/g, '-'), 'PATTERN'));
          }
        }
      }

      // Subcategory as OCCASION tag
      if (data.subcategoryId) {
        const subMap: Record<string, string> = { 'sub-boy': 'boy', 'sub-girl': 'girl', 'sub-for-mama': 'for-mama', 'sub-items': 'items' };
        const subSlug = subMap[data.subcategoryId] || data.subcategoryId;
        tagIds.push(await resolveOrCreateTag(tx, subSlug, 'OCCASION'));
      }

      for (const tagId of [...new Set(tagIds)]) {
        await tx.productTag.create({ data: { productId, tagId } });
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
