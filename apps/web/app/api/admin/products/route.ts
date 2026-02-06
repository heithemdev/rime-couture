/**
 * RIME COUTURE - Admin Products API
 * ==================================
 * GET: Fetch all products for admin management
 * POST: Create new product
 *
 * Resolves hardcoded frontend IDs (e.g. 'cat-kids-clothes', 'clr-red', 'size-2y')
 * to real database UUIDs by looking up by slug/code.
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
// HELPERS
// ============================================================================

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
  return { url: `/uploads/${filename}`, mimeType, bytes: bytes.length, kind };
}

function generateSku(productId: string, index: number) {
  return `RC-${productId.slice(0, 8)}-${String(index + 1).padStart(3, '0')}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Resolve a hardcoded category ID to a real DB UUID (find-or-create) */
async function resolveCategoryId(tx: Prisma.TransactionClient, frontendId: string): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(frontendId)) return frontendId;
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

/** Resolve a hardcoded color ID to a real DB UUID (find-or-create, and ensure hex is set) */
async function resolveColorId(tx: Prisma.TransactionClient, frontendId: string, hex?: string): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(frontendId)) return frontendId;
  const code = COLOR_CODE_MAP[frontendId] || frontendId;
  const resolvedHex = hex || COLOR_HEX_MAP[frontendId] || '#888888';
  let color = await tx.color.findUnique({ where: { code }, select: { id: true, hex: true } });
  if (color) {
    // Ensure hex is always up to date
    if (!color.hex || color.hex === '#888888' || color.hex !== resolvedHex) {
      await tx.color.update({ where: { code }, data: { hex: resolvedHex } });
    }
    return color.id;
  }
  const created = await tx.color.create({
    data: {
      code, hex: resolvedHex, isActive: true,
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

/** Resolve a hardcoded size ID to a real DB UUID (find-or-create) */
async function resolveSizeId(tx: Prisma.TransactionClient, frontendId: string): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(frontendId)) return frontendId;
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

/** Resolve or create a tag by slug and type */
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

// ============================================================================
// POST - Create new product
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const formData = contentType.includes('multipart/form-data') ? await request.formData() : null;
    const dataStr = formData ? (formData.get('data') as string) : null;

    if (formData && !dataStr) {
      return NextResponse.json({ success: false, error: 'Missing product data' }, { status: 400 });
    }

    const data = dataStr ? JSON.parse(dataStr) : await request.json();
    if (!data) {
      return NextResponse.json({ success: false, error: 'Missing product data' }, { status: 400 });
    }

    if (!data.slug || !data.categoryId) {
      return NextResponse.json({ success: false, error: 'Slug and category are required' }, { status: 400 });
    }

    const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (existingSlug) {
      return NextResponse.json({ success: false, error: 'A product with this slug already exists' }, { status: 409 });
    }

    const newProduct = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Resolve category
      const realCategoryId = await resolveCategoryId(tx, data.categoryId);

      const product = await tx.product.create({
        data: {
          slug: data.slug,
          categoryId: realCategoryId,
          basePriceMinor: data.basePriceMinor || 0,
          isActive: data.isActive ?? true,
          status: data.status || 'PUBLISHED',
        },
      });

      // Translations
      if (data.translations?.length > 0) {
        for (const t of data.translations) {
          if (t.name) {
            await tx.productTranslation.create({
              data: {
                productId: product.id,
                locale: t.locale.toUpperCase() as Locale,
                name: t.name,
                description: t.description || '',
                seoTitle: t.seoTitle || null,
                seoDescription: t.seoDescription || null,
              },
            });
          }
        }
      }

      // Resolve all color IDs
      const colorIdMap = new Map<string, string>();
      if (Array.isArray(data.colors)) {
        for (const fid of data.colors) {
          if (typeof fid === 'string' && fid.length > 0) {
            colorIdMap.set(fid, await resolveColorId(tx, fid));
          }
        }
      }

      // Resolve all size IDs
      const sizeIdMap = new Map<string, string>();
      if (Array.isArray(data.sizes)) {
        for (const fid of data.sizes) {
          if (typeof fid === 'string' && fid.length > 0) {
            sizeIdMap.set(fid, await resolveSizeId(tx, fid));
          }
        }
      }

      // Create variants
      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i];
          const sizeId = v.sizeId ? (sizeIdMap.get(v.sizeId) || await resolveSizeId(tx, v.sizeId)) : null;
          const colorId = v.colorId ? (colorIdMap.get(v.colorId) || await resolveColorId(tx, v.colorId)) : null;
          const variantKey = `${colorId || 'no-color'}:${sizeId || 'no-size'}`;
          const sku = typeof v.sku === 'string' && v.sku.trim() ? v.sku.trim() : generateSku(product.id, i);
          await tx.productVariant.create({
            data: { productId: product.id, variantKey, sku, sizeId, colorId, priceMinor: v.priceMinor ?? data.basePriceMinor ?? 0, stock: v.stock ?? 0 },
          });
        }
      }

      // Media uploads
      if (formData && Array.isArray(data.media) && data.media.length > 0) {
        for (let i = 0; i < data.media.length; i++) {
          const m = data.media[i];
          const uploadKey = m.uploadKey as string | undefined;
          if (!uploadKey) continue;
          const file = formData.get(uploadKey);
          if (!(file instanceof File)) continue;

          const saved = await saveUploadedFile(file);
          const asset = await tx.mediaAsset.create({
            data: { kind: saved.kind, url: saved.url, mimeType: saved.mimeType, bytes: saved.bytes, provider: 'LOCAL', meta: { originalName: file.name } },
          });

          let mediaColorId: string | null = null;
          if (typeof m.colorId === 'string' && m.colorId.length > 0) {
            mediaColorId = colorIdMap.get(m.colorId) || await resolveColorId(tx, m.colorId);
          }

          await tx.productMedia.create({
            data: { productId: product.id, mediaId: asset.id, colorId: mediaColorId, position: typeof m.position === 'number' ? m.position : i, isThumb: Boolean(m.isThumb) },
          });
        }

        const hasThumb = await tx.productMedia.findFirst({ where: { productId: product.id, isThumb: true }, select: { id: true } });
        if (!hasThumb) {
          const first = await tx.productMedia.findFirst({ where: { productId: product.id }, orderBy: { position: 'asc' }, select: { id: true } });
          if (first) await tx.productMedia.update({ where: { id: first.id }, data: { isThumb: true } });
        }
      }

      // Tag links: materials, patterns, subcategory
      const tagIds: string[] = [];

      if (Array.isArray(data.materials)) {
        for (const mat of data.materials) {
          if (typeof mat === 'string' && mat.trim()) {
            tagIds.push(await resolveOrCreateTag(tx, mat.trim().toLowerCase().replace(/\s+/g, '-'), 'MATERIAL'));
          }
        }
      }

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

      if (Array.isArray(data.tags)) {
        for (const tid of data.tags) {
          if (typeof tid === 'string' && tid.length > 0) tagIds.push(tid);
        }
      }

      for (const tagId of [...new Set(tagIds)]) {
        await tx.productTag.create({ data: { productId: product.id, tagId } });
      }

      return product;
    });

    return NextResponse.json({ success: true, data: { id: newProduct.id, slug: newProduct.slug } });
  } catch (error) {
    console.error('Admin create product error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}

// ============================================================================
// GET - Fetch all products
// ============================================================================

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        translations: { where: { locale: 'EN' as Locale } },
        category: { include: { translations: { where: { locale: 'EN' as Locale } } } },
        media: { where: { isThumb: true }, take: 1, include: { media: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.translations[0]?.name || product.slug,
      basePriceMinor: product.basePriceMinor,
      isActive: product.isActive,
      status: product.status,
      salesCount: product._count.orderItems,
      category: product.category?.translations[0]?.name || 'Uncategorized',
      imageUrl: product.media[0]?.media?.url || null,
    }));

    return NextResponse.json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error('Admin products error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
