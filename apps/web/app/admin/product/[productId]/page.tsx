/**
 * Admin Product Editor
 * =====================
 * Inline-edit version of the product page — looks exactly like the public product page
 * but with editable fields when edit mode is active.
 */

'use client';

import { useState, useMemo, useEffect, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  Tag,
  Ruler,
  Palette,
  Package,
  Loader2,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  Eye,
  EyeOff,
  Upload,
  Video,
  ChevronDown,
  Scissors,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// CONSTANTS (from shared lib)
// ============================================================================

import {
  PRESET_COLORS,
  PRESET_SIZES as FIXED_SIZES,
  CATEGORIES,
  SUBCATEGORIES,
  COLOR_CODE_TO_FRONTEND,
  SIZE_CODE_TO_FRONTEND,
  CATEGORY_SLUG_TO_FRONTEND,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface MediaItem {
  id: string;
  url: string;
  kind: 'IMAGE' | 'VIDEO';
  isThumb: boolean;
  position: number;
  colorId: string | null;
  file?: File;
  preview?: string;
}

interface VariantItem {
  id: string;
  sizeId: string | null;
  colorId: string | null;
  stock: number;
  priceMinor: number | null;
}

interface Translation {
  locale: 'EN' | 'AR' | 'FR';
  name: string;
  description: string;
}

interface ProductFormData {
  slug: string;
  categoryId: string;
  subcategoryId: string;
  basePriceMinor: number;
  isActive: boolean;
  translations: Translation[];
  variants: VariantItem[];
  media: MediaItem[];
  sizes: string[];
  colors: string[];
  tags: string[];
  materials: string[];
  patterns: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const isNewProduct = productId === 'new';

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(!isNewProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(isNewProduct);

  // Snapshot for cancel
  const [snapshot, setSnapshot] = useState<ProductFormData | null>(null);

  // Active locale tab for translation editing
  const [activeLocale, setActiveLocale] = useState<'EN' | 'AR' | 'FR'>(
    (locale?.toUpperCase() as 'EN' | 'AR' | 'FR') || 'EN',
  );

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeColorTab, setActiveColorTab] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Dropdowns
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Chip inputs
  const [materialInput, setMaterialInput] = useState('');
  const [patternInput, setPatternInput] = useState('');

  // Color picker
  const [availableColors, setAvailableColors] = useState(PRESET_COLORS);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColorHex, setCustomColorHex] = useState('#808080');

  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    slug: '',
    categoryId: '',
    subcategoryId: '',
    basePriceMinor: 0,
    isActive: true,
    translations: [
      { locale: 'EN', name: '', description: '' },
      { locale: 'AR', name: '', description: '' },
      { locale: 'FR', name: '', description: '' },
    ],
    variants: [],
    media: [],
    sizes: [],
    colors: [],
    tags: [],
    materials: [],
    patterns: [],
  });

  // --------------------------------------------------------------------------
  // FETCH PRODUCT DATA
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isNewProduct) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();

        if (!data.success || !data.data) {
          setError(data.error || 'Failed to load product');
          setIsLoading(false);
          return;
        }

        const product = data.data;

        // Map translations
        const mappedTranslations: Translation[] = Array.isArray(
          product.translations,
        )
          ? product.translations.map(
              (pt: {
                locale: string;
                name: string;
                description?: string;
              }) => ({
                locale: (pt.locale || 'EN').toUpperCase() as 'EN' | 'AR' | 'FR',
                name: pt.name || '',
                description: pt.description || '',
              }),
            )
          : [
              { locale: 'EN' as const, name: '', description: '' },
              { locale: 'AR' as const, name: '', description: '' },
              { locale: 'FR' as const, name: '', description: '' },
            ];

        // Build DB UUID → frontend ID maps from variant codes
        const dbColorIdToFrontendId = new Map<string, string>();
        const mappedVariants: VariantItem[] = Array.isArray(product.variants)
          ? product.variants.map(
              (v: {
                id: string;
                sizeId?: string | null;
                colorId?: string | null;
                sizeCode?: string | null;
                colorCode?: string | null;
                stock?: number;
                priceMinor?: number | null;
              }) => {
                let frontendColorId: string | null = null;
                if (v.colorId && v.colorCode) {
                  frontendColorId =
                    COLOR_CODE_TO_FRONTEND[v.colorCode] || v.colorId;
                  dbColorIdToFrontendId.set(v.colorId, frontendColorId!);
                }
                let frontendSizeId: string | null = null;
                if (v.sizeId && v.sizeCode) {
                  frontendSizeId =
                    SIZE_CODE_TO_FRONTEND[v.sizeCode] || v.sizeId;
                }
                return {
                  id: v.id,
                  sizeId: frontendSizeId ?? v.sizeId ?? null,
                  colorId: frontendColorId ?? v.colorId ?? null,
                  stock: v.stock ?? 0,
                  priceMinor: v.priceMinor ?? null,
                };
              },
            )
          : [];

        const mappedMedia: MediaItem[] = Array.isArray(product.media)
          ? product.media.map(
              (m: {
                id: string;
                url: string;
                type?: string;
                kind?: string;
                isPrimary?: boolean;
                isThumb?: boolean;
                position?: number;
                colorId?: string | null;
              }) => ({
                id: m.id,
                url: m.url,
                kind:
                  (m.kind || m.type || 'IMAGE') === 'VIDEO'
                    ? ('VIDEO' as const)
                    : ('IMAGE' as const),
                isThumb: Boolean(m.isThumb ?? m.isPrimary),
                position: typeof m.position === 'number' ? m.position : 0,
                colorId: m.colorId
                  ? dbColorIdToFrontendId.get(m.colorId) || m.colorId
                  : null,
              }),
            )
          : [];

        const sizeIds = Array.from(
          new Set(
            mappedVariants
              .map((v) => v.sizeId)
              .filter(Boolean) as string[],
          ),
        );
        const colorIds = Array.from(
          new Set(
            mappedVariants
              .map((v) => v.colorId)
              .filter(Boolean) as string[],
          ),
        );

        const frontendCategoryId = product.categorySlug
          ? CATEGORY_SLUG_TO_FRONTEND[product.categorySlug] ||
            product.categoryId ||
            ''
          : product.categoryId || '';

        const loaded: ProductFormData = {
          slug: product.slug || '',
          categoryId: frontendCategoryId,
          subcategoryId: product.subcategoryId || '',
          basePriceMinor: product.basePriceMinor || 0,
          isActive: product.isActive ?? true,
          translations: mappedTranslations,
          variants: mappedVariants,
          media: mappedMedia,
          sizes: sizeIds,
          colors: colorIds,
          tags: Array.isArray(product.tags)
            ? product.tags
                .map((t: { id: string }) => t.id)
                .filter(Boolean)
            : [],
          materials: Array.isArray(product.materials)
            ? product.materials
            : [],
          patterns: Array.isArray(product.patterns)
            ? product.patterns
            : [],
        };

        setFormData(loaded);
        setSnapshot(structuredClone(loaded));

        if (colorIds.length > 0) {
          setActiveColorTab(colorIds[0]!);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isNewProduct]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      )
        setCategoryDropdownOpen(false);
      if (
        subcategoryDropdownRef.current &&
        !subcategoryDropdownRef.current.contains(e.target as Node)
      )
        setSubcategoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --------------------------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------------------------
  const currentTranslation = useMemo(() => {
    return (
      formData.translations.find((tr) => tr.locale === activeLocale) ||
      formData.translations[0]!
    );
  }, [formData.translations, activeLocale]);

  const selectedColors = useMemo(() => {
    return availableColors.filter((c) => formData.colors.includes(c.id));
  }, [availableColors, formData.colors]);

  const selectedSizes = useMemo(() => {
    return FIXED_SIZES.filter((s) => formData.sizes.includes(s.id));
  }, [formData.sizes]);

  const categoryName = useMemo(() => {
    return (
      CATEGORIES.find((c) => c.id === formData.categoryId)?.name ||
      'Select Category'
    );
  }, [formData.categoryId]);

  const subcategories = useMemo(
    () => SUBCATEGORIES[formData.categoryId] || [],
    [formData.categoryId],
  );

  const priceDA = Math.round(formData.basePriceMinor / 100);

  // Media filtered by active color tab (for gallery)
  const filteredMedia = useMemo(() => {
    if (!activeColorTab) return formData.media;
    const colorMedia = formData.media.filter(
      (m) => m.colorId === activeColorTab,
    );
    return colorMedia.length > 0 ? colorMedia : formData.media;
  }, [formData.media, activeColorTab]);

  const currentMedia = filteredMedia[selectedImageIndex] || null;

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const updateTranslation = useCallback(
    (field: 'name' | 'description', value: string) => {
      setFormData((prev) => ({
        ...prev,
        translations: prev.translations.map((tr) =>
          tr.locale === activeLocale ? { ...tr, [field]: value } : tr,
        ),
      }));
    },
    [activeLocale],
  );

  const toggleColor = useCallback(
    (colorId: string) => {
      setFormData((prev) => {
        const wasSelected = prev.colors.includes(colorId);
        const newColors = wasSelected
          ? prev.colors.filter((c) => c !== colorId)
          : [...prev.colors, colorId];
        if (!wasSelected) {
          setActiveColorTab(colorId);
          setSelectedImageIndex(0);
        } else if (activeColorTab === colorId) {
          setActiveColorTab(newColors.length > 0 ? newColors[0]! : null);
          setSelectedImageIndex(0);
        }
        return { ...prev, colors: newColors };
      });
    },
    [activeColorTab],
  );

  const toggleSize = useCallback((sizeId: string) => {
    setFormData((prev) => {
      const newSizes = prev.sizes.includes(sizeId)
        ? prev.sizes.filter((s) => s !== sizeId)
        : [...prev.sizes, sizeId];
      return { ...prev, sizes: newSizes };
    });
  }, []);

  const getVariantStock = useCallback(
    (colorId: string | null, sizeId: string | null) => {
      const variant = formData.variants.find(
        (v) => v.colorId === colorId && v.sizeId === sizeId,
      );
      return variant?.stock || 0;
    },
    [formData.variants],
  );

  const updateVariantStock = useCallback(
    (colorId: string | null, sizeId: string | null, stock: number) => {
      setFormData((prev) => {
        const existingIndex = prev.variants.findIndex(
          (v) => v.colorId === colorId && v.sizeId === sizeId,
        );
        if (existingIndex >= 0) {
          const newVariants = [...prev.variants];
          newVariants[existingIndex] = {
            ...newVariants[existingIndex]!,
            stock,
          };
          return { ...prev, variants: newVariants };
        }
        return {
          ...prev,
          variants: [
            ...prev.variants,
            {
              id: `temp-${Date.now()}`,
              colorId,
              sizeId,
              stock,
              priceMinor: null,
            },
          ],
        };
      });
    },
    [],
  );

  const handleFileUpload = useCallback(
    (files: FileList | null, isVideo = false) => {
      if (!files || !activeColorTab) return;
      const newMedia: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const isVideoFile = file.type.startsWith('video/');
        if (isVideo && !isVideoFile) continue;
        if (!isVideo && !file.type.startsWith('image/')) continue;
        if (isVideoFile) {
          const existingVideos = formData.media.filter(
            (m) => m.kind === 'VIDEO' && m.colorId === activeColorTab,
          );
          if (existingVideos.length >= 1) {
            setError('Only one video per color allowed');
            continue;
          }
          if (file.size > 50 * 1024 * 1024) {
            setError('Video must be under 50MB');
            continue;
          }
        }
        const preview = URL.createObjectURL(file);
        newMedia.push({
          id: `temp-${Date.now()}-${i}`,
          url: preview,
          kind: isVideoFile ? 'VIDEO' : 'IMAGE',
          isThumb: formData.media.length === 0 && i === 0,
          position: formData.media.length + i,
          colorId: activeColorTab,
          file,
          preview,
        });
      }
      setFormData((prev) => ({ ...prev, media: [...prev.media, ...newMedia] }));
    },
    [formData.media, activeColorTab],
  );

  const removeMedia = useCallback((id: string) => {
    setFormData((prev) => {
      const newMedia = prev.media.filter((m) => m.id !== id);
      if (newMedia.length > 0 && !newMedia.some((m) => m.isThumb)) {
        const first = newMedia.find((m) => m.kind === 'IMAGE');
        if (first) first.isThumb = true;
      }
      return { ...prev, media: newMedia };
    });
    setSelectedImageIndex(0);
  }, []);

  const setAsThumbnail = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.map((m) => ({ ...m, isThumb: m.id === id })),
    }));
  }, []);

  const addCustomColor = useCallback((hex: string) => {
    const code = `custom-${hex.slice(1)}`;
    const newColor = {
      id: `custom-${hex}-${Date.now()}`,
      code,
      hex,
      label: hex,
    };
    setAvailableColors((prev) => [...prev, newColor]);
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, newColor.id],
    }));
    setActiveColorTab(newColor.id);
    setSelectedImageIndex(0);
    setShowColorPicker(false);
  }, []);

  const enterEditMode = useCallback(() => {
    setSnapshot(structuredClone(formData));
    setEditMode(true);
  }, [formData]);

  const cancelEdit = useCallback(() => {
    if (snapshot) setFormData(snapshot);
    setEditMode(false);
  }, [snapshot]);

  // --------------------------------------------------------------------------
  // SAVE & DELETE
  // --------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const enTranslation = formData.translations.find(
        (tr) => tr.locale === 'EN',
      );
      if (!enTranslation?.name) {
        setError('English name is required');
        setIsSaving(false);
        return;
      }
      if (!formData.categoryId) {
        setError('Category is required');
        setIsSaving(false);
        return;
      }
      if (formData.basePriceMinor <= 0) {
        setError('Price must be greater than 0');
        setIsSaving(false);
        return;
      }

      const payload = {
        ...formData,
        slug:
          formData.slug ||
          enTranslation.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
      };

      const body = new window.FormData();
      const mediaPayload = payload.media.map((m) => {
        if (m.file) {
          const uploadKey = `file_${m.id}`;
          body.append(uploadKey, m.file);
          return {
            id: m.id,
            uploadKey,
            kind: m.kind,
            isThumb: m.isThumb,
            position: m.position,
            colorId: m.colorId || null,
          };
        }
        return {
          id: m.id,
          kind: m.kind,
          isThumb: m.isThumb,
          position: m.position,
          colorId: m.colorId || null,
        };
      });

      body.append(
        'data',
        JSON.stringify({ ...payload, media: mediaPayload }),
      );

      const url = isNewProduct
        ? '/api/admin/products'
        : `/api/admin/products/${productId}`;
      const method = isNewProduct ? 'POST' : 'PUT';
      const res = await fetch(url, { method, body });
      const data = await res.json();

      if (data.success) {
        if (isNewProduct) {
          const newProductId = data.data?.id || productId;
          router.push(`/admin/product/${newProductId}`);
        } else {
          setSnapshot(structuredClone(formData));
          setEditMode(false);
        }
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNewProduct, productId, router]);

  const handleDelete = useCallback(async () => {
    if (isNewProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [isNewProduct, productId, router]);

  // Gallery navigation
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % filteredMedia.length);
    setIsVideoPlaying(false);
  };
  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length,
    );
    setIsVideoPlaying(false);
  };

  // Render Stars Helper
  const renderStars = (rating: number, size = 16) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={
            star <= Math.round(rating)
              ? 'var(--color-accent)'
              : 'transparent'
          }
          stroke={
            star <= Math.round(rating)
              ? 'var(--color-accent)'
              : 'var(--color-border)'
          }
        />
      ))}
    </div>
  );

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <>
        <Header />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 16,
          }}
        >
          <Loader2
            size={40}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p style={{ color: 'var(--color-on-surface-secondary)' }}>
            Loading product...
          </p>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
        <Footer />
      </>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <>
      <Header />
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }

        /* ===== ADMIN TOP BAR ===== */
        .admin-top-bar {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--spacing-md) var(--spacing-xl);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        .admin-top-bar-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .admin-top-bar-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-on-surface-secondary);
          text-decoration: none;
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--color-primary);
        }
        .top-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .top-btn-primary {
          background: linear-gradient(
            135deg,
            var(--color-primary) 0%,
            #ff6b9d 100%
          );
          color: white;
          box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
        }
        .top-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
        }
        .top-btn-edit {
          background: var(--color-secondary);
          color: white;
        }
        .top-btn-edit:hover {
          filter: brightness(0.9);
        }
        .top-btn-outline {
          background: var(--color-surface);
          color: var(--color-on-surface);
          border-color: var(--color-border);
        }
        .top-btn-outline:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        .top-btn-danger {
          background: transparent;
          color: #dc2626;
          border-color: #fecaca;
        }
        .top-btn-danger:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }
        .top-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .visibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: 600;
          cursor: pointer;
          border: 2px solid;
          transition: all 0.2s;
        }
        .visibility-badge.active {
          background: #ecfdf5;
          border-color: #059669;
          color: #059669;
        }
        .visibility-badge.inactive {
          background: #fef2f2;
          border-color: #dc2626;
          color: #dc2626;
        }

        /* ===== ERROR BANNER ===== */
        .error-banner {
          max-width: var(--content-max-width);
          margin: 0 auto var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-xl);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--border-radius-lg);
          color: #dc2626;
          font-size: var(--font-size-sm);
        }
        .error-banner button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          padding: 4px;
        }

        /* ===== PRODUCT PAGE LAYOUT ===== */
        .product-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--spacing-xl);
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
          margin-bottom: var(--spacing-xl);
        }
        .breadcrumb a {
          color: var(--color-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .breadcrumb a:hover {
          color: var(--color-primary);
        }
        .breadcrumb-separator {
          color: var(--color-border);
        }
        .product-layout {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: var(--spacing-3xl);
          align-items: start;
        }
        @media (max-width: 1024px) {
          .product-layout {
            grid-template-columns: 1fr;
          }
        }

        /* ===== GALLERY ===== */
        .gallery {
          position: relative;
        }
        .gallery-main {
          position: relative;
          aspect-ratio: 3 / 4;
          border-radius: var(--border-radius-xl);
          overflow: hidden;
          background: var(--color-surface-elevated);
          margin-bottom: var(--spacing-md);
        }
        .gallery-main.edit-mode {
          border: 2px dashed var(--color-border);
        }
        .gallery-main img,
        .gallery-main video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            var(--color-surface-elevated) 0%,
            var(--color-border) 100%
          );
          color: var(--color-on-surface-secondary);
          gap: var(--spacing-md);
        }
        .gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: var(--color-surface);
          border: none;
          border-radius: var(--border-radius-full);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-level-2);
          transition: all 0.2s ease;
          z-index: 10;
        }
        .gallery-nav:hover {
          background: var(--color-primary);
          color: white;
          transform: translateY(-50%) scale(1.05);
        }
        .gallery-nav.prev {
          left: var(--spacing-md);
        }
        .gallery-nav.next {
          right: var(--spacing-md);
        }
        .gallery-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--border-radius-full);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-level-3);
          transition: all 0.3s ease;
        }
        .gallery-play:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }
        .gallery-thumbnails {
          display: flex;
          gap: var(--spacing-sm);
          overflow-x: auto;
          padding-bottom: var(--spacing-sm);
        }
        .gallery-thumb {
          flex-shrink: 0;
          width: 80px;
          height: 80px;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s ease;
          position: relative;
        }
        .gallery-thumb.active {
          border-color: var(--color-primary);
        }
        .gallery-thumb:hover {
          transform: scale(1.05);
        }
        .gallery-thumb img,
        .gallery-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery-thumb.add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--color-border);
          color: var(--color-on-surface-secondary);
          background: var(--color-surface-elevated);
        }
        .gallery-thumb.add-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        /* Edit overlays on gallery */
        .media-remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s;
        }
        .media-remove-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }
        .thumb-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          padding: 3px 8px;
          background: var(--color-primary);
          color: white;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          z-index: 10;
        }
        .set-thumb-btn {
          position: absolute;
          bottom: 6px;
          left: 6px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 3px;
          z-index: 10;
          transition: all 0.2s;
        }
        .set-thumb-btn:hover {
          background: var(--color-primary);
          color: white;
        }

        /* Color tabs for media */
        .media-color-tabs {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          flex-wrap: wrap;
        }
        .media-color-tabs-label {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
          font-weight: 600;
          white-space: nowrap;
        }
        .media-color-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: var(--font-size-xs);
          font-weight: 600;
          border-radius: var(--border-radius-full);
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-on-surface);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .media-color-tab:hover {
          border-color: var(--color-on-surface-secondary);
        }
        .media-color-tab.active {
          border-color: var(--color-primary);
          background: color-mix(
            in srgb,
            var(--color-primary) 8%,
            var(--color-surface)
          );
        }
        .media-color-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        /* ===== PRODUCT PANEL ===== */
        .product-panel {
          position: sticky;
          top: calc(var(--spacing-xl) + 80px);
          background: var(--color-surface);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-level-2);
          border: 1px solid var(--color-border);
        }
        @media (max-width: 1024px) {
          .product-panel {
            position: static;
          }
        }
        .panel-header {
          margin-bottom: var(--spacing-lg);
        }

        /* Category dropdown */
        .category-row {
          margin-bottom: var(--spacing-md);
          position: relative;
        }
        .panel-category {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: var(--color-surface-elevated);
          color: var(--color-secondary);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .panel-category.editable {
          cursor: pointer;
          border: 2px dashed var(--color-border);
          transition: all 0.2s;
        }
        .panel-category.editable:hover {
          border-color: var(--color-primary);
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 200px;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-level-3);
          z-index: 50;
          padding: 4px;
          max-height: 240px;
          overflow-y: auto;
        }
        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border: none;
          background: transparent;
          font-size: var(--font-size-sm);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;
          text-align: left;
        }
        .dropdown-item:hover {
          background: color-mix(
            in srgb,
            var(--color-primary) 8%,
            var(--color-surface)
          );
          color: var(--color-primary);
        }
        .dropdown-item.selected {
          background: color-mix(
            in srgb,
            var(--color-primary) 8%,
            var(--color-surface)
          );
          color: var(--color-primary);
          font-weight: 600;
        }

        /* Name */
        .panel-name {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
          line-height: var(--line-height-heading);
          margin-bottom: var(--spacing-md);
        }
        .panel-name-input {
          width: 100%;
          padding: 8px 0;
          border: none;
          border-bottom: 2px solid var(--color-border);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
          background: transparent;
          line-height: var(--line-height-heading);
          margin-bottom: var(--spacing-md);
        }
        .panel-name-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .panel-name-input::placeholder {
          color: var(--color-on-surface-secondary);
          font-weight: 400;
        }

        /* Lang tabs */
        .lang-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: var(--spacing-sm);
          background: var(--color-surface-elevated);
          padding: 4px;
          border-radius: var(--border-radius-md);
        }
        .lang-tab {
          flex: 1;
          padding: 8px;
          border: none;
          background: transparent;
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--border-radius-sm);
          transition: all 0.2s;
        }
        .lang-tab.active {
          background: var(--color-surface);
          box-shadow: var(--shadow-level-1);
          color: var(--color-primary);
        }

        /* Rating */
        .panel-rating {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }
        .panel-rating :global(.stars) {
          display: flex;
          gap: 2px;
        }
        .panel-rating-text {
          font-size: var(--font-size-sm);
          color: var(--color-on-surface-secondary);
        }

        /* Price */
        .panel-price {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          margin-bottom: var(--spacing-lg);
        }
        .panel-price-input-wrap {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }
        .panel-price-input {
          width: 160px;
          padding: 8px 12px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          background: transparent;
        }
        .panel-price-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .price-currency {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-on-surface-secondary);
        }

        /* Variant sections */
        .variant-section {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }
        .variant-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-sm);
        }
        .variant-label svg {
          color: var(--color-secondary);
        }
        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        .size-btn {
          min-width: 48px;
          height: 48px;
          padding: 0 var(--spacing-md);
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .size-btn:hover {
          border-color: var(--color-primary);
        }
        .size-btn.selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }
        .color-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          align-items: center;
        }
        .color-btn {
          width: 44px;
          height: 44px;
          border: 3px solid var(--color-border);
          border-radius: var(--border-radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .color-btn:hover {
          transform: scale(1.1);
        }
        .color-btn.selected {
          border-color: var(--color-primary);
          box-shadow:
            0 0 0 2px var(--color-surface),
            0 0 0 4px var(--color-primary);
        }
        .color-btn .check-icon {
          color: white;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }
        .add-color-btn {
          background: var(--color-surface-elevated) !important;
          border-color: var(--color-border) !important;
          color: var(--color-on-surface-secondary) !important;
        }
        .add-color-btn:hover {
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
        }

        /* Color picker */
        .color-picker-panel {
          margin-top: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .color-picker-panel input[type='color'] {
          width: 48px;
          height: 48px;
          border: none;
          cursor: pointer;
          border-radius: var(--border-radius-md);
          padding: 0;
        }
        .color-picker-panel input[type='text'] {
          width: 100px;
          padding: 8px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          font-family: monospace;
          font-size: var(--font-size-sm);
        }
        .color-picker-panel input[type='text']:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .color-picker-add {
          padding: 8px 16px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .color-picker-add:hover {
          filter: brightness(0.9);
        }

        /* Stock */
        .stock-section {
          margin-top: var(--spacing-lg);
        }
        .stock-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .stock-color-group {
          background: var(--color-surface-elevated);
          padding: var(--spacing-md);
          border-radius: var(--border-radius-md);
          margin-bottom: var(--spacing-sm);
        }
        .stock-color-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 500;
          margin-bottom: var(--spacing-sm);
        }
        .stock-sizes {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        .stock-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stock-cell span {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
        }
        .stock-cell input {
          width: 60px;
          padding: 8px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-size-sm);
          text-align: center;
        }
        .stock-cell input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .stock-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .stock-label {
          min-width: 100px;
          font-size: var(--font-size-sm);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stock-row input {
          width: 80px;
          padding: 10px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
          text-align: center;
        }
        .stock-row input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        /* Description section */
        .details-section {
          margin-top: var(--spacing-3xl);
        }
        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-heading);
          color: var(--color-on-surface);
          margin-bottom: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .section-title svg {
          color: var(--color-primary);
        }
        .description-box {
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-xl);
          line-height: 1.8;
          color: var(--color-on-surface);
          white-space: pre-wrap;
        }
        .description-textarea {
          width: 100%;
          min-height: 150px;
          padding: var(--spacing-xl);
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-lg);
          border: 2px solid var(--color-border);
          font-size: var(--font-size-base);
          font-family: inherit;
          line-height: 1.8;
          resize: vertical;
          color: var(--color-on-surface);
        }
        .description-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        /* Tags */
        .tags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-xl);
        }
        .tag-group {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-lg);
        }
        .tag-group-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }
        .tag-chip {
          background: var(--color-surface-elevated);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-sm);
          color: var(--color-on-surface);
        }
        .chip-input-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 10px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius-md);
          background: var(--color-surface);
          align-items: center;
          min-height: 44px;
        }
        .chip-input-wrap:focus-within {
          border-color: var(--color-primary);
        }
        .text-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: color-mix(
            in srgb,
            var(--color-primary) 10%,
            var(--color-surface)
          );
          border: 1px solid
            color-mix(
              in srgb,
              var(--color-primary) 30%,
              var(--color-border)
            );
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-primary);
        }
        .text-chip button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          color: var(--color-primary);
          opacity: 0.6;
        }
        .text-chip button:hover {
          opacity: 1;
        }
        .chip-text-input {
          flex: 1;
          min-width: 120px;
          border: none;
          outline: none;
          font-size: var(--font-size-xs);
          padding: 4px;
          background: transparent;
        }

        /* Trust Features */
        .trust-features {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-lg);
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex: 1;
          justify-content: center;
        }
        .trust-icon {
          width: 36px;
          height: 36px;
          background: var(--color-surface-elevated);
          border-radius: var(--border-radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-secondary);
          flex-shrink: 0;
        }
        .trust-text {
          font-size: var(--font-size-xs);
          color: var(--color-on-surface-secondary);
          line-height: 1.3;
        }

        /* Delete Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-md);
        }
        .modal-content {
          background: var(--color-surface);
          border-radius: var(--border-radius-xl);
          padding: var(--spacing-xl);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .modal-content h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-md);
        }
        .modal-content p {
          color: var(--color-on-surface-secondary);
          margin-bottom: var(--spacing-lg);
        }
        .modal-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
        }

        /* ===== MOBILE ===== */
        @media (max-width: 768px) {
          .product-page {
            padding: var(--spacing-md);
          }
          .admin-top-bar {
            padding: var(--spacing-sm) var(--spacing-md);
          }
          .top-btn {
            padding: 8px 12px;
            font-size: var(--font-size-xs);
          }
          .gallery-main {
            aspect-ratio: 1 / 1;
          }
          .panel-name {
            font-size: var(--font-size-xl);
          }
          .panel-name-input {
            font-size: var(--font-size-xl);
          }
          .panel-price {
            font-size: var(--font-size-2xl);
          }
          .gallery-thumb {
            width: 60px;
            height: 60px;
          }
          .product-panel {
            padding: var(--spacing-md);
          }
        }
        @media (max-width: 480px) {
          .product-page {
            padding: var(--spacing-sm);
          }
          .panel-name {
            font-size: var(--font-size-lg);
          }
          .panel-name-input {
            font-size: var(--font-size-lg);
          }
          .panel-price {
            font-size: var(--font-size-xl);
          }
        }
      `}</style>

      {/* ===== TOP ADMIN BAR ===== */}
      <div className="admin-top-bar">
        <div className="admin-top-bar-left">
          <Link href="/admin" className="back-link">
            <ChevronLeft size={20} /> Dashboard
          </Link>
          {editMode && (
            <button
              className={`visibility-badge ${formData.isActive ? 'active' : 'inactive'}`}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: !prev.isActive,
                }))
              }
            >
              {formData.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              {formData.isActive ? 'Visible' : 'Hidden'}
            </button>
          )}
        </div>
        <div className="admin-top-bar-right">
          {!isNewProduct && !editMode && (
            <button
              className="top-btn top-btn-edit"
              onClick={enterEditMode}
            >
              <Edit3 size={16} /> Edit
            </button>
          )}
          {editMode && !isNewProduct && (
            <button className="top-btn top-btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
          {!isNewProduct && (
            <button
              className="top-btn top-btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
            </button>
          )}
          {editMode && (
            <button
              className="top-btn top-btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===== PRODUCT PAGE LAYOUT ===== */}
      <div className="product-page">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/shopping">Shop</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{categoryName}</span>
          <span className="breadcrumb-separator">/</span>
          <span>{currentTranslation.name || 'New Product'}</span>
        </nav>

        <div className="product-layout">
          {/* ===== GALLERY ===== */}
          <div className="gallery">
            {/* Color tabs for media */}
            {selectedColors.length > 0 && (
              <div className="media-color-tabs">
                <span className="media-color-tabs-label">
                  {editMode ? 'Media for:' : 'Color:'}
                </span>
                {selectedColors.map((c) => (
                  <button
                    key={c.id}
                    className={`media-color-tab ${activeColorTab === c.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveColorTab(c.id);
                      setSelectedImageIndex(0);
                    }}
                  >
                    <span
                      className="media-color-dot"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`gallery-main ${editMode ? 'edit-mode' : ''}`}
              onDragOver={
                editMode
                  ? (e) => {
                      e.preventDefault();
                    }
                  : undefined
              }
              onDrop={
                editMode
                  ? (e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files);
                    }
                  : undefined
              }
            >
              {currentMedia?.kind === 'VIDEO' ? (
                isVideoPlaying ? (
                  <video
                    src={currentMedia.url}
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <video
                      src={currentMedia.url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      className="gallery-play"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <Play size={32} fill="white" />
                    </button>
                  </>
                )
              ) : currentMedia?.url ? (
                <img
                  src={currentMedia.url}
                  alt={currentTranslation.name || 'Product'}
                />
              ) : (
                <div className="gallery-placeholder">
                  {editMode ? (
                    <>
                      <Upload size={40} />
                      <span>
                        {selectedColors.length === 0
                          ? 'Select a color first, then add images'
                          : 'Drag & drop images here or click + below'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Package size={40} />
                      <span>No image available</span>
                    </>
                  )}
                </div>
              )}

              {/* Edit mode overlays */}
              {editMode && currentMedia && (
                <button
                  className="media-remove-btn"
                  onClick={() => removeMedia(currentMedia.id)}
                >
                  <X size={16} />
                </button>
              )}
              {editMode &&
                currentMedia?.kind === 'IMAGE' &&
                !currentMedia.isThumb && (
                  <button
                    className="set-thumb-btn"
                    onClick={() => setAsThumbnail(currentMedia.id)}
                  >
                    <Check size={12} /> Set Thumbnail
                  </button>
                )}
              {currentMedia?.isThumb && (
                <div className="thumb-badge">Thumbnail</div>
              )}

              {/* Navigation arrows */}
              {filteredMedia.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevImage}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="gallery-nav next" onClick={nextImage}>
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {(filteredMedia.length > 0 || editMode) && (
              <div className="gallery-thumbnails">
                {filteredMedia.map((media, index) => (
                  <div
                    key={media.id}
                    className={`gallery-thumb ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setIsVideoPlaying(false);
                    }}
                  >
                    {media.kind === 'VIDEO' ? (
                      <video src={media.url} muted />
                    ) : (
                      <img src={media.url} alt="" />
                    )}
                  </div>
                ))}
                {editMode && activeColorTab && (
                  <>
                    <div
                      className="gallery-thumb add-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus size={24} />
                    </div>
                    {!filteredMedia.some((m) => m.kind === 'VIDEO') && (
                      <div
                        className="gallery-thumb add-btn"
                        onClick={() => videoInputRef.current?.click()}
                        title="Add video"
                      >
                        <Video size={20} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFileUpload(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                handleFileUpload(e.target.files, true);
                e.target.value = '';
              }}
            />

            {/* ===== DESCRIPTION ===== */}
            <div className="details-section">
              <h2 className="section-title">
                <Package size={24} /> Product Description
              </h2>
              {editMode ? (
                <>
                  <div
                    className="lang-tabs"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    {(['EN', 'AR', 'FR'] as const).map((lang) => (
                      <button
                        key={lang}
                        className={`lang-tab ${activeLocale === lang ? 'active' : ''}`}
                        onClick={() => setActiveLocale(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="description-textarea"
                    placeholder={`Description (${activeLocale})...`}
                    value={currentTranslation.description}
                    onChange={(e) =>
                      updateTranslation('description', e.target.value)
                    }
                    dir={activeLocale === 'AR' ? 'rtl' : 'ltr'}
                  />
                </>
              ) : (
                <div className="description-box">
                  {currentTranslation.description || 'No description yet.'}
                </div>
              )}

              {/* Tags: Materials & Patterns */}
              {editMode ? (
                <div className="tags-grid">
                  <div className="tag-group">
                    <div className="tag-group-title">
                      <Scissors size={14} /> Material
                    </div>
                    <div className="chip-input-wrap">
                      {formData.materials.map((mat, i) => (
                        <span key={i} className="text-chip">
                          {mat}
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                materials: prev.materials.filter(
                                  (_, idx) => idx !== i,
                                ),
                              }))
                            }
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="chip-text-input"
                        placeholder="Type & press Enter..."
                        value={materialInput}
                        onChange={(e) => setMaterialInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && materialInput.trim()) {
                            e.preventDefault();
                            if (
                              !formData.materials.includes(
                                materialInput.trim(),
                              )
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                materials: [
                                  ...prev.materials,
                                  materialInput.trim(),
                                ],
                              }));
                            }
                            setMaterialInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="tag-group">
                    <div className="tag-group-title">
                      <Sparkles size={14} /> Pattern
                    </div>
                    <div className="chip-input-wrap">
                      {formData.patterns.map((pat, i) => (
                        <span key={i} className="text-chip">
                          {pat}
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                patterns: prev.patterns.filter(
                                  (_, idx) => idx !== i,
                                ),
                              }))
                            }
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="chip-text-input"
                        placeholder="Type & press Enter..."
                        value={patternInput}
                        onChange={(e) => setPatternInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && patternInput.trim()) {
                            e.preventDefault();
                            if (
                              !formData.patterns.includes(
                                patternInput.trim(),
                              )
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                patterns: [
                                  ...prev.patterns,
                                  patternInput.trim(),
                                ],
                              }));
                            }
                            setPatternInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                (formData.materials.length > 0 ||
                  formData.patterns.length > 0) && (
                  <div className="tags-grid">
                    {formData.materials.length > 0 && (
                      <div className="tag-group">
                        <div className="tag-group-title">
                          <Tag size={14} /> Material
                        </div>
                        <div className="tag-list">
                          {formData.materials.map((mat) => (
                            <span key={mat} className="tag-chip">
                              {mat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.patterns.length > 0 && (
                      <div className="tag-group">
                        <div className="tag-group-title">
                          <Tag size={14} /> Pattern
                        </div>
                        <div className="tag-list">
                          {formData.patterns.map((pat) => (
                            <span key={pat} className="tag-chip">
                              {pat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ===== PRODUCT PANEL (sticky side panel) ===== */}
          <div className="product-panel">
            <div className="panel-header">
              {/* Category */}
              <div className="category-row" ref={categoryDropdownRef}>
                {editMode ? (
                  <>
                    <div
                      className="panel-category editable"
                      onClick={() =>
                        setCategoryDropdownOpen(!categoryDropdownOpen)
                      }
                    >
                      <Tag size={12} /> {categoryName}
                      <ChevronDown
                        size={12}
                        style={{
                          transition: 'transform 0.2s',
                          transform: categoryDropdownOpen
                            ? 'rotate(180deg)'
                            : 'none',
                        }}
                      />
                    </div>
                    {categoryDropdownOpen && (
                      <div className="dropdown-menu">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            className={`dropdown-item ${formData.categoryId === cat.id ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                categoryId: cat.id,
                                subcategoryId: '',
                              }));
                              setCategoryDropdownOpen(false);
                            }}
                          >
                            {cat.name}
                            {formData.categoryId === cat.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="panel-category">
                    <Tag size={12} /> {categoryName}
                  </div>
                )}

                {editMode &&
                  formData.categoryId &&
                  subcategories.length > 0 && (
                    <div
                      style={{ marginTop: 8, position: 'relative' }}
                      ref={subcategoryDropdownRef}
                    >
                      <div
                        className="panel-category editable"
                        onClick={() =>
                          setSubcategoryDropdownOpen(!subcategoryDropdownOpen)
                        }
                      >
                        {subcategories.find(
                          (s) => s.id === formData.subcategoryId,
                        )?.name || 'Select Subcategory'}
                        <ChevronDown
                          size={12}
                          style={{
                            transition: 'transform 0.2s',
                            transform: subcategoryDropdownOpen
                              ? 'rotate(180deg)'
                              : 'none',
                          }}
                        />
                      </div>
                      {subcategoryDropdownOpen && (
                        <div className="dropdown-menu">
                          {subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              className={`dropdown-item ${formData.subcategoryId === sub.id ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  subcategoryId: sub.id,
                                }));
                                setSubcategoryDropdownOpen(false);
                              }}
                            >
                              {sub.name}
                              {formData.subcategoryId === sub.id && (
                                <Check size={14} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Name */}
              {editMode ? (
                <>
                  <div className="lang-tabs">
                    {(['EN', 'AR', 'FR'] as const).map((lang) => (
                      <button
                        key={lang}
                        className={`lang-tab ${activeLocale === lang ? 'active' : ''}`}
                        onClick={() => setActiveLocale(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="panel-name-input"
                    placeholder={`Product Name (${activeLocale})...`}
                    value={currentTranslation.name}
                    onChange={(e) => updateTranslation('name', e.target.value)}
                    dir={activeLocale === 'AR' ? 'rtl' : 'ltr'}
                  />
                </>
              ) : (
                <h1 className="panel-name">
                  {currentTranslation.name || 'Untitled Product'}
                </h1>
              )}

              {/* Rating */}
              {!isNewProduct && (
                <div className="panel-rating">
                  {renderStars(0)}
                  <span className="panel-rating-text">No reviews yet</span>
                </div>
              )}

              {/* Price */}
              {editMode ? (
                <div className="panel-price-input-wrap">
                  <input
                    type="number"
                    className="panel-price-input"
                    placeholder="0"
                    min="0"
                    value={priceDA || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        basePriceMinor: Math.round(
                          Math.max(0, val || 0) * 100,
                        ),
                      }));
                    }}
                  />
                  <span className="price-currency">DA</span>
                </div>
              ) : (
                <div className="panel-price">{formatPrice(priceDA)}</div>
              )}
            </div>

            {/* Size Selection */}
            <div className="variant-section">
              <div className="variant-label">
                <Ruler size={16} />{' '}
                {editMode ? 'Select Available Sizes' : 'Sizes'}
              </div>
              <div className="size-options">
                {(editMode ? FIXED_SIZES : selectedSizes).map((size) => (
                  <button
                    key={size.id}
                    className={`size-btn ${formData.sizes.includes(size.id) ? 'selected' : ''}`}
                    onClick={
                      editMode ? () => toggleSize(size.id) : undefined
                    }
                    style={!editMode ? { cursor: 'default' } : undefined}
                  >
                    {size.code}
                  </button>
                ))}
                {!editMode && selectedSizes.length === 0 && (
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-on-surface-secondary)',
                    }}
                  >
                    No sizes set
                  </span>
                )}
              </div>
            </div>

            {/* Color Selection */}
            <div className="variant-section">
              <div className="variant-label">
                <Palette size={16} />{' '}
                {editMode ? 'Select Available Colors' : 'Colors'}
              </div>
              <div className="color-options">
                {(editMode ? availableColors : selectedColors).map(
                  (color) => (
                    <button
                      key={color.id}
                      className={`color-btn ${formData.colors.includes(color.id) ? 'selected' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={
                        editMode ? () => toggleColor(color.id) : undefined
                      }
                      title={color.label}
                    >
                      {formData.colors.includes(color.id) && (
                        <Check size={16} className="check-icon" />
                      )}
                    </button>
                  ),
                )}
                {editMode && (
                  <button
                    className="color-btn add-color-btn"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Add custom color"
                  >
                    <Plus size={18} />
                  </button>
                )}
                {!editMode && selectedColors.length === 0 && (
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-on-surface-secondary)',
                    }}
                  >
                    No colors set
                  </span>
                )}
              </div>

              {editMode && showColorPicker && (
                <div className="color-picker-panel">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                  />
                  <input
                    type="text"
                    value={customColorHex}
                    maxLength={7}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      setCustomColorHex(val);
                    }}
                  />
                  <button
                    className="color-picker-add"
                    onClick={() => addCustomColor(customColorHex)}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              )}
            </div>

            {/* Stock Matrix (edit mode only) */}
            {editMode &&
              (selectedColors.length > 0 || selectedSizes.length > 0) && (
                <div className="variant-section stock-section">
                  <div className="variant-label">
                    <Package size={16} /> Stock Per Variant
                  </div>
                  <div className="stock-grid">
                    {selectedColors.length === 0 ? (
                      selectedSizes.map((size) => (
                        <div key={size.id} className="stock-row">
                          <span className="stock-label">{size.code}</span>
                          <input
                            type="number"
                            min="0"
                            value={getVariantStock(null, size.id)}
                            onChange={(e) =>
                              updateVariantStock(
                                null,
                                size.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      ))
                    ) : selectedSizes.length === 0 ? (
                      selectedColors.map((color) => (
                        <div key={color.id} className="stock-row">
                          <span className="stock-label">
                            <span
                              className="color-dot"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.label}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={getVariantStock(color.id, null)}
                            onChange={(e) =>
                              updateVariantStock(
                                color.id,
                                null,
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      ))
                    ) : (
                      selectedColors.map((color) => (
                        <div key={color.id} className="stock-color-group">
                          <div className="stock-color-header">
                            <span
                              className="color-dot"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.label}
                          </div>
                          <div className="stock-sizes">
                            {selectedSizes.map((size) => (
                              <div
                                key={`${color.id}-${size.id}`}
                                className="stock-cell"
                              >
                                <span>{size.code}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={getVariantStock(
                                    color.id,
                                    size.id,
                                  )}
                                  onChange={(e) =>
                                    updateVariantStock(
                                      color.id,
                                      size.id,
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            {/* Trust Features */}
            <div className="trust-features">
              <div className="trust-item">
                <div className="trust-icon">
                  <Truck size={20} />
                </div>
                <div className="trust-text">Fast Delivery</div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <Shield size={20} />
                </div>
                <div className="trust-text">Secure Payment</div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <RotateCcw size={20} />
                </div>
                <div className="trust-text">Easy Returns</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Product?</h3>
            <p>
              This action cannot be undone. The product and all its data will
              be permanently removed.
            </p>
            <div className="modal-actions">
              <button
                className="top-btn top-btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="top-btn top-btn-primary"
                style={{ background: '#dc2626' }}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
