/**
 * RIME COUTURE - Admin Add/Edit Product Page
 * ==========================================
 * Color-first workflow: user must pick colors before uploading media
 * Per-color media: each color gets its own images/video
 * Custom category dropdown, RGB color input, 3/4 frame
 * Mobile-first responsive design with i18n
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Video,
  X,
  Palette,
  Check,
  Loader2,
  Package,
  Tag,
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  Shirt,
  UtensilsCrossed,
  Baby,
  Heart,
  Scissors,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// I18N TRANSLATIONS
// ============================================================================

const translations = {
  EN: {
    backToDashboard: 'Back to Dashboard',
    delete: 'Delete',
    saveProduct: 'Save Product',
    saving: 'Saving...',
    loading: 'Loading product...',
    category: 'Category',
    selectCategory: 'Select category...',
    subcategory: 'Subcategory',
    selectSubcategory: 'Select subcategory...',
    kidsClothes: 'Kids Clothes',
    kitchenStuff: 'Kitchen Stuff',
    boy: 'Boy',
    girl: 'Girl',
    forMama: 'For Mama',
    items: 'Items',
    visible: 'Visible',
    hidden: 'Hidden',
    productName: 'Product Name',
    description: 'Description',
    descriptionPlaceholder: 'Enter product description...',
    sizes: 'Sizes (Age)',
    colors: 'Colors',
    addCustomColor: 'Pick Custom Color',
    enterRgb: 'Enter RGB or HEX',
    addColor: 'Add',
    stockPerVariant: 'Stock per Variant',
    detected: 'Detected:',
    dragDropImages: 'Drag & drop images here',
    or: 'or',
    browseFiles: 'Browse Files',
    addVideo: 'Add Video',
    setAsThumbnail: 'Set as thumbnail',
    thumbnail: 'Thumbnail',
    onlyOneVideo: 'Only 1 video allowed per color',
    videoMaxSize: 'Video must be under 50MB',
    nameRequired: 'Product name (English) is required',
    categoryRequired: 'Please select a category',
    priceRequired: 'Please enter a valid price',
    deleteConfirmTitle: 'Delete Product?',
    deleteConfirmText: 'This action cannot be undone. The product and all its data will be permanently removed.',
    cancelBtn: 'Cancel',
    selectColorFirst: 'Select at least one color to start adding media',
    mediaFor: 'Media for:',
    noMediaForColor: 'No images yet for this color',
    colorPickerTitle: 'Color Picker',
    red: 'R',
    green: 'G',
    blue: 'B',
    hexLabel: 'HEX',
    material: 'Material',
    pattern: 'Pattern',
    materialPlaceholder: 'e.g. Cotton, Silk, Polyester...',
    patternPlaceholder: 'e.g. Striped, Floral, Solid...',
    addMaterial: 'Add material (press Enter)',
    addPattern: 'Add pattern (press Enter)',
  },
  AR: {
    backToDashboard: 'العودة للوحة التحكم',
    delete: 'حذف',
    saveProduct: 'حفظ المنتج',
    saving: 'جاري الحفظ...',
    loading: 'جاري تحميل المنتج...',
    category: 'الفئة',
    selectCategory: 'اختر فئة...',
    subcategory: 'الفئة الفرعية',
    selectSubcategory: 'اختر فئة فرعية...',
    kidsClothes: 'ملابس أطفال',
    kitchenStuff: 'أدوات مطبخ',
    boy: 'ولد',
    girl: 'بنت',
    forMama: 'للماما',
    items: 'أدوات',
    visible: 'مرئي',
    hidden: 'مخفي',
    productName: 'اسم المنتج',
    description: 'الوصف',
    descriptionPlaceholder: 'أدخل وصف المنتج...',
    sizes: 'المقاسات (العمر)',
    colors: 'الألوان',
    addCustomColor: 'اختيار لون مخصص',
    enterRgb: 'أدخل RGB أو HEX',
    addColor: 'إضافة',
    stockPerVariant: 'المخزون لكل نوع',
    detected: 'تم اكتشاف:',
    dragDropImages: 'اسحب وأفلت الصور هنا',
    or: 'أو',
    browseFiles: 'تصفح الملفات',
    addVideo: 'إضافة فيديو',
    setAsThumbnail: 'تعيين كصورة مصغرة',
    thumbnail: 'صورة مصغرة',
    onlyOneVideo: 'فيديو واحد فقط لكل لون',
    videoMaxSize: 'يجب أن يكون الفيديو أقل من 50 ميجابايت',
    nameRequired: 'اسم المنتج (بالإنجليزية) مطلوب',
    categoryRequired: 'يرجى اختيار فئة',
    priceRequired: 'يرجى إدخال سعر صالح',
    deleteConfirmTitle: 'حذف المنتج؟',
    deleteConfirmText: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج وجميع بياناته نهائيًا.',
    cancelBtn: 'إلغاء',
    selectColorFirst: 'اختر لونًا واحدًا على الأقل لبدء إضافة الوسائط',
    mediaFor: 'وسائط لـ:',
    noMediaForColor: 'لا توجد صور لهذا اللون بعد',
    colorPickerTitle: 'منتقي الألوان',
    red: 'أحمر',
    green: 'أخضر',
    blue: 'أزرق',
    hexLabel: 'HEX',
    material: 'المادة',
    pattern: 'النمط',
    materialPlaceholder: 'مثال: قطن، حرير، بوليستر...',
    patternPlaceholder: 'مثال: مخطط، زهري، سادة...',
    addMaterial: 'أضف مادة (اضغط Enter)',
    addPattern: 'أضف نمط (اضغط Enter)',
  },
  FR: {
    backToDashboard: 'Retour au tableau de bord',
    delete: 'Supprimer',
    saveProduct: 'Enregistrer le produit',
    saving: 'Enregistrement...',
    loading: 'Chargement du produit...',
    category: 'Catégorie',
    selectCategory: 'Sélectionner une catégorie...',
    subcategory: 'Sous-catégorie',
    selectSubcategory: 'Sélectionner une sous-catégorie...',
    kidsClothes: 'Vêtements Enfants',
    kitchenStuff: 'Articles de Cuisine',
    boy: 'Garçon',
    girl: 'Fille',
    forMama: 'Pour Maman',
    items: 'Articles',
    visible: 'Visible',
    hidden: 'Masqué',
    productName: 'Nom du produit',
    description: 'Description',
    descriptionPlaceholder: 'Entrez la description du produit...',
    sizes: 'Tailles (Âge)',
    colors: 'Couleurs',
    addCustomColor: 'Choisir couleur personnalisée',
    enterRgb: 'Entrer RGB ou HEX',
    addColor: 'Ajouter',
    stockPerVariant: 'Stock par variante',
    detected: 'Détecté :',
    dragDropImages: 'Glissez-déposez les images ici',
    or: 'ou',
    browseFiles: 'Parcourir les fichiers',
    addVideo: 'Ajouter une vidéo',
    setAsThumbnail: 'Définir comme miniature',
    thumbnail: 'Miniature',
    onlyOneVideo: 'Un seul vidéo autorisé par couleur',
    videoMaxSize: 'La vidéo doit faire moins de 50 Mo',
    nameRequired: 'Le nom du produit (anglais) est requis',
    categoryRequired: 'Veuillez sélectionner une catégorie',
    priceRequired: 'Veuillez entrer un prix valide',
    deleteConfirmTitle: 'Supprimer le produit ?',
    deleteConfirmText: 'Cette action est irréversible. Le produit et toutes ses données seront définitivement supprimés.',
    cancelBtn: 'Annuler',
    selectColorFirst: 'Sélectionnez au moins une couleur pour ajouter des médias',
    mediaFor: 'Médias pour :',
    noMediaForColor: "Pas encore d'images pour cette couleur",
    colorPickerTitle: 'Sélecteur de couleur',
    red: 'R',
    green: 'V',
    blue: 'B',
    hexLabel: 'HEX',
    material: 'Matière',
    pattern: 'Motif',
    materialPlaceholder: 'ex. Coton, Soie, Polyester...',
    patternPlaceholder: 'ex. Rayé, Fleuri, Uni...',
    addMaterial: 'Ajouter une matière (appuyez sur Entrée)',
    addPattern: 'Ajouter un motif (appuyez sur Entrée)',
  },
} as const;

// ============================================================================
// HARDCODED OPTIONS
// ============================================================================

const FIXED_SIZES = [
  { id: 'size-2y', code: '2Y', label: '2 Years' },
  { id: 'size-3y', code: '3Y', label: '3 Years' },
  { id: 'size-4y', code: '4Y', label: '4 Years' },
  { id: 'size-5y', code: '5Y', label: '5 Years' },
  { id: 'size-6y', code: '6Y', label: '6 Years' },
  { id: 'size-7y', code: '7Y', label: '7 Years' },
  { id: 'size-8y', code: '8Y', label: '8 Years' },
  { id: 'size-9y', code: '9Y', label: '9 Years' },
  { id: 'size-10y', code: '10Y', label: '10 Years' },
  { id: 'size-11y', code: '11Y', label: '11 Years' },
  { id: 'size-12y', code: '12Y', label: '12 Years' },
];

const PRESET_COLORS: ColorOption[] = [
  { id: 'clr-black', code: 'black', hex: '#000000', label: 'Black' },
  { id: 'clr-white', code: 'white', hex: '#FFFFFF', label: 'White' },
  { id: 'clr-red', code: 'red', hex: '#DC2626', label: 'Red' },
  { id: 'clr-pink', code: 'pink', hex: '#EC4899', label: 'Pink' },
  { id: 'clr-rose', code: 'rose', hex: '#F43F5E', label: 'Rose' },
  { id: 'clr-orange', code: 'orange', hex: '#EA580C', label: 'Orange' },
  { id: 'clr-yellow', code: 'yellow', hex: '#EAB308', label: 'Yellow' },
  { id: 'clr-green', code: 'green', hex: '#16A34A', label: 'Green' },
  { id: 'clr-teal', code: 'teal', hex: '#0D9488', label: 'Teal' },
  { id: 'clr-blue', code: 'blue', hex: '#2563EB', label: 'Blue' },
  { id: 'clr-navy', code: 'navy', hex: '#1E3A5F', label: 'Navy' },
  { id: 'clr-purple', code: 'purple', hex: '#7C3AED', label: 'Purple' },
  { id: 'clr-lavender', code: 'lavender', hex: '#A78BFA', label: 'Lavender' },
  { id: 'clr-brown', code: 'brown', hex: '#92400E', label: 'Brown' },
  { id: 'clr-beige', code: 'beige', hex: '#D4B896', label: 'Beige' },
  { id: 'clr-gray', code: 'gray', hex: '#6B7280', label: 'Gray' },
  { id: 'clr-silver', code: 'silver', hex: '#C0C0C0', label: 'Silver' },
  { id: 'clr-gold', code: 'gold', hex: '#D4A017', label: 'Gold' },
];

const CATEGORIES = [
  { id: 'cat-kids-clothes', slug: 'kids-clothes', name: 'Kids Clothes', icon: 'shirt' },
  { id: 'cat-kitchen-stuff', slug: 'kitchen-stuff', name: 'Kitchen Stuff', icon: 'utensils' },
] as const;

const SUBCATEGORIES: Record<string, { id: string; slug: string; name: string }[]> = {
  'cat-kids-clothes': [
    { id: 'sub-boy', slug: 'boy', name: 'Boy' },
    { id: 'sub-girl', slug: 'girl', name: 'Girl' },
  ],
  'cat-kitchen-stuff': [
    { id: 'sub-for-mama', slug: 'for-mama', name: 'For Mama' },
    { id: 'sub-items', slug: 'items', name: 'Items' },
  ],
};

// ============================================================================
// TYPES
// ============================================================================

interface ColorOption {
  id: string;
  code: string;
  hex: string;
  label: string;
}

interface MediaItem {
  id: string;
  url: string;
  kind: 'IMAGE' | 'VIDEO';
  isThumb: boolean;
  position: number;
  colorId?: string | null;
  file?: File;
  preview?: string;
}

interface VariantItem {
  id: string;
  tempId?: string;
  colorId: string | null;
  sizeId: string | null;
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
// COLOR DETECTION ALGORITHM
// ============================================================================

async function extractDominantColors(imageFile: File, count: number = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      if (!ctx) {
        resolve([]);
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const pixels = imageData.data;

      const colorMap = new Map<string, number>();

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]!;
        const g = pixels[i + 1]!;
        const b = pixels[i + 2]!;
        const a = pixels[i + 3]!;

        if (a < 128) continue;

        const qr = Math.round(r / 8) * 8;
        const qg = Math.round(g / 8) * 8;
        const qb = Math.round(b / 8) * 8;

        const brightness = (qr + qg + qb) / 3;
        if (brightness > 240 || brightness < 15) continue;

        const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      const sorted = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count * 3);

      const result: string[] = [];
      for (const [hex] of sorted) {
        if (result.length >= count) break;

        const isSimilar = result.some((existing) => {
          const diff = colorDifference(existing, hex);
          return diff < 50;
        });

        if (!isSimilar) {
          result.push(hex);
        }
      }

      URL.revokeObjectURL(img.src);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve([]);
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

function colorDifference(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

function hexToColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;

  if (max - min < 30) {
    if (brightness > 200) return 'White';
    if (brightness > 140) return 'Light Gray';
    if (brightness > 80) return 'Gray';
    if (brightness > 40) return 'Dark Gray';
    return 'Black';
  }

  if (r > g && r > b) {
    if (g > 150) return 'Orange';
    if (b > 100) return 'Pink';
    return 'Red';
  }
  if (g > r && g > b) {
    if (r > 150) return 'Yellow-Green';
    if (b > 100) return 'Teal';
    return 'Green';
  }
  if (b > r && b > g) {
    if (r > 150) return 'Purple';
    if (g > 100) return 'Cyan';
    return 'Blue';
  }
  if (r === g && r > b) return 'Yellow';
  if (r === b && r > g) return 'Magenta';
  if (g === b && g > r) return 'Cyan';

  return 'Color';
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const isNewProduct = productId === 'new';

  const uiLocale = (locale?.toUpperCase() as 'EN' | 'AR' | 'FR') || 'EN';
  const t = translations[uiLocale] || translations.EN;

  const [isLoading, setIsLoading] = useState(!isNewProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [availableColors, setAvailableColors] = useState<ColorOption[]>(PRESET_COLORS);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [showSpectrumPicker, setShowSpectrumPicker] = useState(false);

  // RGB color picker state
  const [rgbR, setRgbR] = useState(128);
  const [rgbG, setRgbG] = useState(128);
  const [rgbB, setRgbB] = useState(128);
  const [hexInput, setHexInput] = useState('#808080');

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

  const [materialInput, setMaterialInput] = useState('');
  const [patternInput, setPatternInput] = useState('');

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeColorTab, setActiveColorTab] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<'EN' | 'AR' | 'FR'>(uiLocale);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [isDetectingColors, setIsDetectingColors] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueBarRef = useRef<HTMLCanvasElement>(null);

  // ============================================================================
  // FETCH DATA (only product details for editing — sizes/colors/categories are hardcoded)
  // ============================================================================

  useEffect(() => {
    if (isNewProduct) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();

        if (data.success && data.data) {
          const product = data.data;

          const mappedTranslations: Translation[] = Array.isArray(product.translations)
            ? product.translations.map((pt: { locale: string; name: string; description?: string }) => ({
                locale: (pt.locale || 'EN').toUpperCase() as 'EN' | 'AR' | 'FR',
                name: pt.name || '',
                description: pt.description || '',
              }))
            : [
                { locale: 'EN' as const, name: '', description: '' },
                { locale: 'AR' as const, name: '', description: '' },
                { locale: 'FR' as const, name: '', description: '' },
              ];

          const mappedVariants: VariantItem[] = Array.isArray(product.variants)
            ? product.variants.map((v: { id: string; sizeId?: string | null; colorId?: string | null; stock?: number; priceMinor?: number | null }) => ({
                id: v.id,
                sizeId: v.sizeId ?? null,
                colorId: v.colorId ?? null,
                stock: v.stock ?? 0,
                priceMinor: v.priceMinor ?? null,
              }))
            : [];

          const mappedMedia: MediaItem[] = Array.isArray(product.media)
            ? product.media.map((m: { id: string; url: string; type?: string; kind?: string; isPrimary?: boolean; isThumb?: boolean; position?: number; colorId?: string | null }) => ({
                id: m.id,
                url: m.url,
                kind: (m.kind || m.type || 'IMAGE') === 'VIDEO' ? 'VIDEO' as const : 'IMAGE' as const,
                isThumb: Boolean(m.isThumb ?? m.isPrimary),
                position: typeof m.position === 'number' ? m.position : 0,
                colorId: m.colorId || null,
              }))
            : [];

          const sizeIds = Array.from(
            new Set(mappedVariants.map((v) => v.sizeId).filter(Boolean) as string[])
          );
          const colorIds = Array.from(
            new Set(mappedVariants.map((v) => v.colorId).filter(Boolean) as string[])
          );

          const tagIds = Array.isArray(product.tags)
            ? product.tags.map((t: { id: string }) => t.id).filter(Boolean)
            : [];

          setFormData({
            slug: product.slug || '',
            categoryId: product.categoryId || '',
            subcategoryId: product.subcategoryId || '',
            basePriceMinor: product.basePriceMinor || 0,
            isActive: product.isActive ?? true,
            translations: mappedTranslations,
            variants: mappedVariants,
            media: mappedMedia,
            sizes: sizeIds,
            colors: colorIds,
            tags: tagIds,
            materials: Array.isArray(product.materials) ? product.materials : [],
            patterns: Array.isArray(product.patterns) ? product.patterns : [],
          });

          // Set initial active color tab to the first color
          if (colorIds.length > 0) {
            setActiveColorTab(colorIds[0]!);
          }
        } else {
          setError(data.error || 'Failed to load product');
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
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(e.target as Node)) {
        setSubcategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const currentTranslation = useMemo(() => {
    return formData.translations.find((tr) => tr.locale === activeLocale) || formData.translations[0];
  }, [formData.translations, activeLocale]);

  const selectedColors = useMemo(() => {
    return availableColors.filter((c) => formData.colors.includes(c.id));
  }, [availableColors, formData.colors]);

  const selectedSizes = useMemo(() => {
    return FIXED_SIZES.filter((s) => formData.sizes.includes(s.id));
  }, [formData.sizes]);

  // Media filtered by active color tab
  const filteredMedia = useMemo(() => {
    if (!activeColorTab) return [];
    return formData.media.filter((m) => m.colorId === activeColorTab);
  }, [formData.media, activeColorTab]);

  const currentMedia = filteredMedia[selectedMediaIndex] || null;

  const selectedCategoryName = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === formData.categoryId);
    if (!cat) return '';
    return cat.id === 'cat-kids-clothes' ? t.kidsClothes : t.kitchenStuff;
  }, [formData.categoryId, t]);

  const subcategories = useMemo(() => {
    return SUBCATEGORIES[formData.categoryId] || [];
  }, [formData.categoryId]);

  const selectedSubcategoryName = useMemo(() => {
    const sub = subcategories.find((s) => s.id === formData.subcategoryId);
    if (!sub) return '';
    const labels: Record<string, string> = {
      'sub-boy': t.boy,
      'sub-girl': t.girl,
      'sub-for-mama': t.forMama,
      'sub-items': t.items,
    };
    return labels[sub.id] || sub.name;
  }, [subcategories, formData.subcategoryId, t]);

  const hasColors = formData.colors.length > 0;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const updateTranslation = useCallback((field: 'name' | 'description', value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations.map((tr) =>
        tr.locale === activeLocale ? { ...tr, [field]: value } : tr
      ),
    }));
  }, [activeLocale]);

  const handleSlugChange = useCallback((name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  useEffect(() => {
    const enTranslation = formData.translations.find((tr) => tr.locale === 'EN');
    if (enTranslation?.name && !formData.slug) {
      handleSlugChange(enTranslation.name);
    }
  }, [formData.translations, formData.slug, handleSlugChange]);

  const handleFileUpload = useCallback(async (files: FileList | null, isVideo = false) => {
    if (!files || !activeColorTab) return;

    const newMedia: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const isVideoFile = file.type.startsWith('video/');
      if (isVideo && !isVideoFile) continue;
      if (!isVideo && !file.type.startsWith('image/')) continue;

      if (isVideoFile) {
        // Only 1 video per color
        const existingVideosForColor = formData.media.filter((m) => m.kind === 'VIDEO' && m.colorId === activeColorTab);
        if (existingVideosForColor.length >= 1) {
          setError(t.onlyOneVideo);
          continue;
        }
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_VIDEO_SIZE) {
          setError(t.videoMaxSize);
          continue;
        }
      }

      const preview = URL.createObjectURL(file);
      const id = `temp-${Date.now()}-${i}`;

      newMedia.push({
        id,
        url: preview,
        kind: isVideoFile ? 'VIDEO' : 'IMAGE',
        isThumb: formData.media.length === 0 && i === 0,
        position: formData.media.length + i,
        colorId: activeColorTab,
        file,
        preview,
      });
    }

    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, ...newMedia],
    }));

    // Detect dominant colors from first uploaded image
    if (newMedia.length > 0 && !isVideo) {
      const firstImage = newMedia.find((m) => m.kind === 'IMAGE');
      if (firstImage?.file) {
        setIsDetectingColors(true);
        const colors = await extractDominantColors(firstImage.file);
        setDetectedColors(colors);
        setIsDetectingColors(false);
      }
    }
  }, [formData.media, activeColorTab, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (hasColors && activeColorTab) setIsDraggingMedia(true);
  }, [hasColors, activeColorTab]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMedia(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMedia(false);
    if (hasColors && activeColorTab) handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload, hasColors, activeColorTab]);

  const removeMedia = useCallback((id: string) => {
    setFormData((prev) => {
      const newMedia = prev.media.filter((m) => m.id !== id);
      if (newMedia.length > 0 && !newMedia.some((m) => m.isThumb)) {
        const firstImage = newMedia.find((m) => m.kind === 'IMAGE');
        if (firstImage) firstImage.isThumb = true;
      }
      return { ...prev, media: newMedia };
    });
    setSelectedMediaIndex(0);
  }, []);

  const setAsThumbnail = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.map((m) => ({ ...m, isThumb: m.id === id })),
    }));
  }, []);

  const toggleColor = useCallback((colorId: string) => {
    setFormData((prev) => {
      const wasSelected = prev.colors.includes(colorId);
      const newColors = wasSelected
        ? prev.colors.filter((c) => c !== colorId)
        : [...prev.colors, colorId];

      // If adding a color, set it as active tab
      if (!wasSelected) {
        setActiveColorTab(colorId);
        setSelectedMediaIndex(0);
      } else if (activeColorTab === colorId) {
        // Switching to next available color or null
        const remaining = newColors;
        setActiveColorTab(remaining.length > 0 ? remaining[0]! : null);
        setSelectedMediaIndex(0);
      }

      return { ...prev, colors: newColors };
    });
  }, [activeColorTab]);

  const addCustomColor = useCallback((hex: string) => {
    const code = hexToColorName(hex).toLowerCase().replace(/\s+/g, '-') + '-' + hex.slice(1);
    const newColor: ColorOption = {
      id: `custom-${hex}-${Date.now()}`,
      code,
      hex,
      label: hexToColorName(hex),
    };
    setAvailableColors((prev) => [...prev, newColor]);
    setFormData((prev) => ({ ...prev, colors: [...prev.colors, newColor.id] }));
    setActiveColorTab(newColor.id);
    setSelectedMediaIndex(0);
  }, []);

  const handleAddCustomColorFromPicker = useCallback(() => {
    addCustomColor(hexInput);
    setShowSpectrumPicker(false);
  }, [hexInput, addCustomColor]);

  const [hueValue, setHueValue] = useState(0);

  // Draw spectrum picker (XP Paint style)
  useEffect(() => {
    if (!showSpectrumPicker) return;

    // Draw hue bar
    const hueCanvas = hueBarRef.current;
    if (hueCanvas) {
      const ctx = hueCanvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, hueCanvas.height);
        for (let i = 0; i <= 360; i += 1) {
          gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
      }
    }

    // Draw saturation/lightness spectrum
    const specCanvas = spectrumCanvasRef.current;
    if (specCanvas) {
      const ctx = specCanvas.getContext('2d');
      if (ctx) {
        const { r: hr, g: hg, b: hb } = hexToRgb(rgbToHex(
          ...hslToRgb(hueValue, 1, 0.5)
        ));
        // White to hue color (horizontal)
        const gradH = ctx.createLinearGradient(0, 0, specCanvas.width, 0);
        gradH.addColorStop(0, '#ffffff');
        gradH.addColorStop(1, `rgb(${hr},${hg},${hb})`);
        ctx.fillStyle = gradH;
        ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);
        // Transparent to black (vertical)
        const gradV = ctx.createLinearGradient(0, 0, 0, specCanvas.height);
        gradV.addColorStop(0, 'rgba(0,0,0,0)');
        gradV.addColorStop(1, '#000000');
        ctx.fillStyle = gradV;
        ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);
      }
    }
  }, [showSpectrumPicker, hueValue]);

  // Redraw spectrum when hue changes
  useEffect(() => {
    if (!showSpectrumPicker) return;
    const specCanvas = spectrumCanvasRef.current;
    if (!specCanvas) return;
    const ctx = specCanvas.getContext('2d');
    if (!ctx) return;

    const [hr, hg, hb] = hslToRgb(hueValue, 1, 0.5);
    const gradH = ctx.createLinearGradient(0, 0, specCanvas.width, 0);
    gradH.addColorStop(0, '#ffffff');
    gradH.addColorStop(1, `rgb(${hr},${hg},${hb})`);
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);
    const gradV = ctx.createLinearGradient(0, 0, 0, specCanvas.height);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);
  }, [hueValue, showSpectrumPicker]);

  const handleSpectrumClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setRgbR(pixel[0]!);
    setRgbG(pixel[1]!);
    setRgbB(pixel[2]!);
    setHexInput(rgbToHex(pixel[0]!, pixel[1]!, pixel[2]!));
  }, []);

  const handleHueClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueBarRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hue = (y / rect.height) * 360;
    setHueValue(Math.max(0, Math.min(360, hue)));
    const [r, g, b] = hslToRgb(hue, 1, 0.5);
    // Set preview to pure hue
    setRgbR(r);
    setRgbG(g);
    setRgbB(b);
    setHexInput(rgbToHex(r, g, b));
  }, []);

  const toggleSize = useCallback((sizeId: string) => {
    setFormData((prev) => {
      const newSizes = prev.sizes.includes(sizeId)
        ? prev.sizes.filter((s) => s !== sizeId)
        : [...prev.sizes, sizeId];
      return { ...prev, sizes: newSizes };
    });
  }, []);

  const updateVariantStock = useCallback((colorId: string | null, sizeId: string | null, stock: number) => {
    setFormData((prev) => {
      const existingIndex = prev.variants.findIndex(
        (v) => v.colorId === colorId && v.sizeId === sizeId
      );

      if (existingIndex >= 0) {
        const newVariants = [...prev.variants];
        newVariants[existingIndex] = { ...newVariants[existingIndex]!, stock };
        return { ...prev, variants: newVariants };
      } else {
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
      }
    });
  }, []);

  const getVariantStock = useCallback((colorId: string | null, sizeId: string | null) => {
    const variant = formData.variants.find(
      (v) => v.colorId === colorId && v.sizeId === sizeId
    );
    return variant?.stock || 0;
  }, [formData.variants]);

  // ============================================================================
  // SAVE & DELETE
  // ============================================================================

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const enTranslation = formData.translations.find((tr) => tr.locale === 'EN');
      if (!enTranslation?.name) {
        setError(t.nameRequired);
        setIsSaving(false);
        return;
      }
      if (!formData.categoryId) {
        setError(t.categoryRequired);
        setIsSaving(false);
        return;
      }
      if (formData.basePriceMinor <= 0) {
        setError(t.priceRequired);
        setIsSaving(false);
        return;
      }

      const payload = {
        ...formData,
        slug:
          formData.slug ||
          formData.translations
            .find((tr) => tr.locale === 'EN')
            ?.name?.toLowerCase()
            .replace(/\s+/g, '-') ||
          'product',
      };

      // Build multipart form data (supports file uploads)
      const body = new FormData();

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
        JSON.stringify({
          ...payload,
          media: mediaPayload,
        })
      );

      const url = isNewProduct ? '/api/admin/products' : `/api/admin/products/${productId}`;
      const method = isNewProduct ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        body,
      });

      const data = await res.json();

      if (data.success) {
        const newProductId = data.data?.id || productId;
        router.push(`/product/${newProductId}`);
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNewProduct, productId, router, t]);

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

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="admin-product-page">
          <style jsx>{styles}</style>
          <div className="loading-state">
            <Loader2 className="spin" size={40} />
            <p>{t.loading}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const activeColorObj = selectedColors.find((c) => c.id === activeColorTab);
  const colorHasVideo = filteredMedia.some((m) => m.kind === 'VIDEO');

  return (
    <>
      <Header />

      <div className="admin-product-page">
        <style jsx>{styles}</style>
        
        {/* Header Bar */}
        <div className="admin-header">
          <Link href="/admin" className="back-link">
            <ChevronLeft size={20} />
            {t.backToDashboard}
          </Link>

          <div className="admin-header-actions">
            {!isNewProduct && (
              <button
                className="btn btn-outline btn-danger-outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 size={18} />
                <span className="btn-text">{t.delete}</span>
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              <span className="btn-text">{isSaving ? t.saving : t.saveProduct}</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            {error}
            <button onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Layout */}
        <div className="product-layout">
          {/* Gallery Section */}
          <div className="gallery">
            {/* Color tabs for media — only show when colors are selected */}
            {hasColors && (
              <div className="media-color-tabs">
                <span className="media-color-tabs-label">{t.mediaFor}</span>
                <div className="media-color-tabs-list">
                  {selectedColors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`media-color-tab ${activeColorTab === c.id ? 'active' : ''}`}
                      onClick={() => { setActiveColorTab(c.id); setSelectedMediaIndex(0); }}
                      title={c.label}
                    >
                      <span className="media-color-dot" style={{ backgroundColor: c.hex }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`gallery-main ${isDraggingMedia ? 'dragging' : ''} ${!hasColors ? 'disabled' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!hasColors ? (
                /* No colors selected — show prompt */
                <div className="upload-placeholder color-prompt">
                  <div className="upload-icon">
                    <Palette size={48} />
                  </div>
                  <p>{t.selectColorFirst}</p>
                </div>
              ) : currentMedia ? (
                <>
                  {currentMedia.kind === 'VIDEO' ? (
                    <video src={currentMedia.url} controls />
                  ) : (
                    <img src={currentMedia.url} alt="Product" />
                  )}
                  
                  <button
                    className="media-remove"
                    onClick={() => removeMedia(currentMedia.id)}
                  >
                    <X size={16} />
                  </button>

                  {currentMedia.kind === 'IMAGE' && !currentMedia.isThumb && (
                    <button
                      className="media-thumb-btn"
                      onClick={() => setAsThumbnail(currentMedia.id)}
                    >
                      <Check size={14} /> {t.setAsThumbnail}
                    </button>
                  )}

                  {currentMedia.isThumb && (
                    <div className="thumb-badge">{t.thumbnail}</div>
                  )}
                </>
              ) : (
                /* Has color but no media yet */
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <ImageIcon size={48} />
                  </div>
                  <p>{activeColorObj ? `${t.noMediaForColor} "${activeColorObj.label}"` : t.dragDropImages}</p>
                  <span>{t.or}</span>
                  <button
                    className="btn btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={18} />
                    {t.browseFiles}
                  </button>
                </div>
              )}

              {filteredMedia.length > 1 && (
                <>
                  <button
                    className="gallery-nav prev"
                    onClick={() => setSelectedMediaIndex((i) => (i - 1 + filteredMedia.length) % filteredMedia.length)}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="gallery-nav next"
                    onClick={() => setSelectedMediaIndex((i) => (i + 1) % filteredMedia.length)}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails row — only show when colors selected */}
            {hasColors && activeColorTab && (
              <div className="gallery-thumbnails">
                {filteredMedia.map((media, index) => (
                  <div
                    key={media.id}
                    className={`gallery-thumb ${index === selectedMediaIndex ? 'active' : ''}`}
                    onClick={() => setSelectedMediaIndex(index)}
                  >
                    {media.kind === 'VIDEO' ? (
                      <video src={media.url} muted />
                    ) : (
                      <img src={media.url} alt="" />
                    )}
                    {media.kind === 'VIDEO' && (
                      <div className="video-badge">
                        <Video size={12} />
                      </div>
                    )}
                  </div>
                ))}

                <button
                  className="gallery-thumb add-media"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={24} />
                </button>

                {!colorHasVideo && (
                  <button
                    className="gallery-thumb add-video"
                    onClick={() => videoInputRef.current?.click()}
                    title={t.addVideo}
                  >
                    <Video size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Detected colors suggestion */}
            {detectedColors.length > 0 && (
              <div className="detected-colors">
                <span className="detected-label">
                  {isDetectingColors ? <Loader2 className="spin" size={14} /> : `✨ ${t.detected}`}
                </span>
                {detectedColors.map((hex) => (
                  <button
                    key={hex}
                    className="detected-color"
                    style={{ backgroundColor: hex }}
                    onClick={() => addCustomColor(hex)}
                    title={`Add ${hexToColorName(hex)}`}
                  />
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { handleFileUpload(e.target.files); e.target.value = ''; }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => { handleFileUpload(e.target.files, true); e.target.value = ''; }}
            />
          </div>

          {/* Product Info Panel */}
          <div className="product-panel">
            <div className="panel-header">
              {/* Category dropdown */}
              <div className="category-select" ref={categoryDropdownRef}>
                <label>
                  <Layers size={14} />
                  {t.category}
                </label>
                <button
                  type="button"
                  className={`custom-dropdown-trigger ${categoryDropdownOpen ? 'open' : ''}`}
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <span className={selectedCategoryName ? '' : 'placeholder'}>
                    {selectedCategoryName || t.selectCategory}
                  </span>
                  <ChevronDown size={16} className={`dropdown-chevron ${categoryDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {categoryDropdownOpen && (
                  <div className="custom-dropdown-menu">
                    {CATEGORIES.map((cat) => {
                      const catLabel = cat.id === 'cat-kids-clothes' ? t.kidsClothes : t.kitchenStuff;
                      const CatIcon = cat.id === 'cat-kids-clothes' ? Shirt : UtensilsCrossed;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`custom-dropdown-item ${formData.categoryId === cat.id ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, categoryId: cat.id, subcategoryId: '' }));
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CatIcon size={16} />
                            {catLabel}
                          </span>
                          {formData.categoryId === cat.id && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subcategory dropdown (conditional) */}
              {formData.categoryId && subcategories.length > 0 && (
                <div className="category-select" ref={subcategoryDropdownRef}>
                  <label>
                    {formData.categoryId === 'cat-kids-clothes' ? <Baby size={14} /> : <Heart size={14} />}
                    {t.subcategory}
                  </label>
                  <button
                    type="button"
                    className={`custom-dropdown-trigger ${subcategoryDropdownOpen ? 'open' : ''}`}
                    onClick={() => setSubcategoryDropdownOpen(!subcategoryDropdownOpen)}
                  >
                    <span className={selectedSubcategoryName ? '' : 'placeholder'}>
                      {selectedSubcategoryName || t.selectSubcategory}
                    </span>
                    <ChevronDown size={16} className={`dropdown-chevron ${subcategoryDropdownOpen ? 'rotated' : ''}`} />
                  </button>
                  {subcategoryDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      {subcategories.map((sub) => {
                        const subLabels: Record<string, string> = {
                          'sub-boy': t.boy,
                          'sub-girl': t.girl,
                          'sub-for-mama': t.forMama,
                          'sub-items': t.items,
                        };
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`custom-dropdown-item ${formData.subcategoryId === sub.id ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, subcategoryId: sub.id }));
                              setSubcategoryDropdownOpen(false);
                            }}
                          >
                            {subLabels[sub.id] || sub.name}
                            {formData.subcategoryId === sub.id && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                className={`visibility-toggle ${formData.isActive ? 'active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
              >
                {formData.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                {formData.isActive ? t.visible : t.hidden}
              </button>
            </div>

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
              placeholder={t.productName}
              value={currentTranslation?.name || ''}
              onChange={(e) => updateTranslation('name', e.target.value)}
              dir={activeLocale === 'AR' ? 'rtl' : 'ltr'}
            />

            <div className="panel-price-input">
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={formData.basePriceMinor / 100 || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData((prev) => ({ ...prev, basePriceMinor: Math.round(Math.max(0, val || 0) * 100) }));
                }}
              />
              <span className="currency">DA</span>
            </div>

            <div className="description-section">
              <label>{t.description}</label>
              <textarea
                placeholder={t.descriptionPlaceholder}
                value={currentTranslation?.description || ''}
                onChange={(e) => updateTranslation('description', e.target.value)}
                dir={activeLocale === 'AR' ? 'rtl' : 'ltr'}
                rows={4}
              />
            </div>

            <div className="variant-section">
              <label>
                <Package size={14} />
                {t.sizes}
              </label>
              <div className="size-options">
                {FIXED_SIZES.map((size) => (
                  <button
                    key={size.id}
                    className={`size-btn ${formData.sizes.includes(size.id) ? 'selected' : ''}`}
                    onClick={() => toggleSize(size.id)}
                  >
                    {size.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="variant-section">
              <label>
                <Palette size={14} />
                {t.colors}
              </label>

              <div className="color-options">
                {availableColors.map((color) => (
                  <button
                    key={color.id}
                    className={`color-btn ${formData.colors.includes(color.id) ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#d1d5db' : color.hex }}
                    onClick={() => toggleColor(color.id)}
                    title={color.label}
                  >
                    {formData.colors.includes(color.id) && (
                      <Check size={16} style={{ filter: ['#FFFFFF', '#FFFF00', '#EAB308', '#C0C0C0', '#D4B896', '#D4A017'].includes(color.hex.toUpperCase()) ? 'none' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))', color: ['#FFFFFF', '#FFFF00', '#EAB308', '#C0C0C0', '#D4B896', '#D4A017'].includes(color.hex.toUpperCase()) ? '#333' : 'white' }} />
                    )}
                  </button>
                ))}

                {/* Open spectrum picker */}
                <button
                  className="color-btn add-color-btn"
                  onClick={() => setShowSpectrumPicker(!showSpectrumPicker)}
                  title={t.addCustomColor}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* XP Paint-style Color Spectrum Picker */}
              {showSpectrumPicker && (
                <div className="spectrum-picker">
                  <div className="spectrum-header">
                    <span><Palette size={14} /> {t.colorPickerTitle}</span>
                    <button onClick={() => setShowSpectrumPicker(false)}><X size={14} /></button>
                  </div>

                  <div className="spectrum-body">
                    {/* Main gradient canvas */}
                    <canvas
                      ref={spectrumCanvasRef}
                      width={220}
                      height={180}
                      className="spectrum-canvas"
                      onClick={handleSpectrumClick}
                    />

                    {/* Hue slider bar */}
                    <canvas
                      ref={hueBarRef}
                      width={24}
                      height={180}
                      className="hue-bar"
                      onClick={handleHueClick}
                    />
                  </div>

                  {/* Preview + RGB/HEX inputs */}
                  <div className="spectrum-preview-row">
                    <div className="spectrum-color-preview" style={{ backgroundColor: hexInput }} />
                    <div className="spectrum-inputs">
                      <div className="rgb-field">
                        <label>{t.red}</label>
                        <input
                          type="number" min="0" max="255" value={rgbR}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                            setRgbR(v);
                            setHexInput(rgbToHex(v, rgbG, rgbB));
                          }}
                        />
                      </div>
                      <div className="rgb-field">
                        <label>{t.green}</label>
                        <input
                          type="number" min="0" max="255" value={rgbG}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                            setRgbG(v);
                            setHexInput(rgbToHex(rgbR, v, rgbB));
                          }}
                        />
                      </div>
                      <div className="rgb-field">
                        <label>{t.blue}</label>
                        <input
                          type="number" min="0" max="255" value={rgbB}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                            setRgbB(v);
                            setHexInput(rgbToHex(rgbR, rgbG, v));
                          }}
                        />
                      </div>
                      <div className="rgb-field">
                        <label>{t.hexLabel}</label>
                        <input
                          type="text"
                          value={hexInput}
                          maxLength={7}
                          style={{ fontFamily: 'monospace' }}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#')) val = '#' + val;
                            setHexInput(val);
                            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                              const { r, g, b } = hexToRgb(val);
                              setRgbR(r);
                              setRgbG(g);
                              setRgbB(b);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button className="btn btn-primary rgb-add-btn" onClick={handleAddCustomColorFromPicker}>
                    <Plus size={16} />
                    {t.addColor}
                  </button>
                </div>
              )}
            </div>

            {(selectedColors.length > 0 || selectedSizes.length > 0) && (
              <div className="variant-section stock-matrix">
                <label>
                  <Tag size={14} />
                  {t.stockPerVariant}
                </label>
                
                <div className="stock-grid">
                  {selectedColors.length === 0 ? (
                    selectedSizes.map((size) => (
                      <div key={size.id} className="stock-row">
                        <span className="stock-label">{size.code}</span>
                        <input
                          type="number"
                          min="0"
                          value={getVariantStock(null, size.id)}
                          onChange={(e) => updateVariantStock(null, size.id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))
                  ) : selectedSizes.length === 0 ? (
                    selectedColors.map((color) => (
                      <div key={color.id} className="stock-row">
                        <span className="stock-label">
                          <span className="color-dot" style={{ backgroundColor: color.hex }} />
                          {color.label}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={getVariantStock(color.id, null)}
                          onChange={(e) => updateVariantStock(color.id, null, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))
                  ) : (
                    selectedColors.map((color) => (
                      <div key={color.id} className="stock-color-group">
                        <div className="stock-color-header">
                          <span className="color-dot" style={{ backgroundColor: color.hex }} />
                          {color.label}
                        </div>
                        <div className="stock-sizes">
                          {selectedSizes.map((size) => (
                            <div key={`${color.id}-${size.id}`} className="stock-cell">
                              <span>{size.code}</span>
                              <input
                                type="number"
                                min="0"
                                value={getVariantStock(color.id, size.id)}
                                onChange={(e) => updateVariantStock(color.id, size.id, parseInt(e.target.value) || 0)}
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
            
            {/* ===== MATERIAL (free text input) ===== */}
            <div className="variant-section">
              <label>
                <Scissors size={14} />
                {t.material}
              </label>
              <div className="chip-input-wrap">
                {formData.materials.map((mat, i) => (
                  <span key={i} className="text-chip">
                    {mat}
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, materials: prev.materials.filter((_, idx) => idx !== i) }))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="chip-text-input"
                  placeholder={t.materialPlaceholder}
                  value={materialInput}
                  onChange={(e) => setMaterialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && materialInput.trim()) {
                      e.preventDefault();
                      if (!formData.materials.includes(materialInput.trim())) {
                        setFormData((prev) => ({ ...prev, materials: [...prev.materials, materialInput.trim()] }));
                      }
                      setMaterialInput('');
                    }
                  }}
                />
              </div>
            </div>

            {/* ===== PATTERN (free text input) ===== */}
            <div className="variant-section">
              <label>
                <Sparkles size={14} />
                {t.pattern}
              </label>
              <div className="chip-input-wrap">
                {formData.patterns.map((pat, i) => (
                  <span key={i} className="text-chip">
                    {pat}
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, patterns: prev.patterns.filter((_, idx) => idx !== i) }))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="chip-text-input"
                  placeholder={t.patternPlaceholder}
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && patternInput.trim()) {
                      e.preventDefault();
                      if (!formData.patterns.includes(patternInput.trim())) {
                        setFormData((prev) => ({ ...prev, patterns: [...prev.patterns, patternInput.trim()] }));
                      }
                      setPatternInput('');
                    }
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t.deleteConfirmTitle}</h3>
            <p>{t.deleteConfirmText}</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>
                {t.cancelBtn}
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = `
  .admin-product-page {
    min-height: 100vh;
    background: var(--color-background, #fafafa);
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
  }
  .back-link:hover {
    color: #be185d;
  }

  .admin-header-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn-primary {
    background: linear-gradient(135deg, #be185d 0%, #ff6b9d 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 77, 129, 0.3);
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 77, 129, 0.4);
  }
  .btn-outline {
    background: white;
    color: #0f172a;
    border: 2px solid #e2e8f0;
  }
  .btn-outline:hover:not(:disabled) {
    border-color: #be185d;
    color: #be185d;
  }
  .btn-danger-outline {
    border-color: #fecaca;
    color: #dc2626;
  }
  .btn-danger-outline:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #dc2626;
  }
  .btn-danger {
    background: #dc2626;
    color: white;
  }
  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    margin-bottom: 24px;
    font-size: 14px;
  }
  .error-banner button {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #dc2626;
    opacity: 0.7;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;
    color: #64748b;
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ========== LAYOUT ========== */

  .product-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 48px;
    align-items: start;
  }

  /* ========== GALLERY ========== */

  .gallery {
    position: relative;
  }

  .media-color-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .media-color-tabs-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 600;
    white-space: nowrap;
  }
  .media-color-tabs-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .media-color-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 999px;
    border: 2px solid #e2e8f0;
    background: white;
    color: #0f172a;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .media-color-tab:hover {
    border-color: #cbd5e1;
  }
  .media-color-tab.active {
    border-color: #be185d;
    background: #fdf2f8;
    box-shadow: 0 0 0 3px rgba(190, 24, 93, 0.12);
  }
  .media-color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(15, 23, 42, 0.15);
    flex-shrink: 0;
  }

  .gallery-main {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 16px;
    overflow: hidden;
    background: #f1f5f9;
    margin-bottom: 12px;
    border: 2px dashed transparent;
    transition: all 0.2s;
  }
  .gallery-main.dragging {
    border-color: #be185d;
    background: #fdf2f8;
  }
  .gallery-main.disabled {
    opacity: 0.7;
  }
  .gallery-main img,
  .gallery-main video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #64748b;
    text-align: center;
    padding: 32px;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    background: linear-gradient(135deg, #fdf2f8 0%, #f1f5f9 100%);
  }
  .upload-placeholder.color-prompt {
    border-color: #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }
  .upload-icon {
    width: 88px;
    height: 88px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #be185d;
    box-shadow: 0 4px 16px rgba(190, 24, 93, 0.12);
  }
  .upload-placeholder p {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    max-width: 280px;
  }
  .upload-placeholder span {
    font-size: 14px;
    color: #94a3b8;
  }

  .media-remove {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 10;
  }
  .media-remove:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  .media-thumb-btn {
    position: absolute;
    bottom: 12px;
    left: 12px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
    transition: all 0.2s;
  }
  .media-thumb-btn:hover {
    background: #be185d;
    color: white;
  }

  .thumb-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 6px 10px;
    background: #be185d;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    z-index: 10;
  }

  .gallery-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    background: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s;
    z-index: 10;
  }
  .gallery-nav:hover {
    background: #be185d;
    color: white;
    transform: translateY(-50%) scale(1.05);
  }
  .gallery-nav.prev { left: 12px; }
  .gallery-nav.next { right: 12px; }

  .gallery-thumbnails {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .gallery-thumb {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.2s;
    position: relative;
    background: #f1f5f9;
  }
  .gallery-thumb.active {
    border-color: #be185d;
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
  .gallery-thumb.add-media,
  .gallery-thumb.add-video {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #e2e8f0;
    color: #94a3b8;
  }
  .gallery-thumb.add-media:hover,
  .gallery-thumb.add-video:hover {
    border-color: #be185d;
    color: #be185d;
  }

  .video-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detected-colors {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 14px;
    background: #f1f5f9;
    border-radius: 10px;
  }
  .detected-label {
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .detected-color {
    width: 28px;
    height: 28px;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  .detected-color:hover {
    transform: scale(1.2);
  }

  /* ========== PRODUCT PANEL ========== */

  .product-panel {
    position: sticky;
    top: 100px;
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 24px;
  }

  /* Custom Category Dropdown */
  .category-select {
    flex: 1;
    position: relative;
  }
  .category-select label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .custom-dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  .custom-dropdown-trigger:hover {
    border-color: #cbd5e1;
  }
  .custom-dropdown-trigger.open {
    border-color: #be185d;
    box-shadow: 0 0 0 3px rgba(190, 24, 93, 0.08);
  }
  .custom-dropdown-trigger .placeholder {
    color: #94a3b8;
  }
  .dropdown-chevron {
    transition: transform 0.2s;
    color: #64748b;
    flex-shrink: 0;
  }
  .dropdown-chevron.rotated {
    transform: rotate(180deg);
  }
  .custom-dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 50;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }
  .custom-dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: none;
    background: transparent;
    font-size: 14px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;
    text-align: left;
  }
  .custom-dropdown-item:hover {
    background: #fdf2f8;
    color: #be185d;
  }
  .custom-dropdown-item.selected {
    background: #fdf2f8;
    color: #be185d;
    font-weight: 600;
  }

  .visibility-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    margin-top: 22px;
  }
  .visibility-toggle.active {
    background: #ecfdf5;
    border-color: #059669;
    color: #059669;
  }

  .lang-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
  }
  .lang-tab {
    flex: 1;
    padding: 10px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .lang-tab.active {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    color: #be185d;
  }

  .panel-name-input {
    width: 100%;
    padding: 16px;
    border: none;
    border-bottom: 2px solid #e2e8f0;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    background: transparent;
    margin-bottom: 16px;
  }
  .panel-name-input:focus {
    outline: none;
    border-color: #be185d;
  }
  .panel-name-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .panel-price-input {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
  }
  .panel-price-input input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 22px;
    font-weight: 700;
    color: #be185d;
    background: transparent;
    max-width: 200px;
  }
  .panel-price-input input:focus {
    outline: none;
    border-color: #be185d;
  }
  .panel-price-input .currency {
    font-size: 18px;
    font-weight: 700;
    color: #64748b;
  }

  .description-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  .description-section label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    margin-bottom: 8px;
  }
  .description-section textarea {
    width: 100%;
    padding: 14px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }
  .description-section textarea:focus {
    outline: none;
    border-color: #be185d;
  }

  .variant-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  .variant-section label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .size-btn {
    min-width: 48px;
    height: 48px;
    padding: 0 16px;
    border: 2px solid #e2e8f0;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .size-btn:hover {
    border-color: #be185d;
  }
  .size-btn.selected {
    background: #be185d;
    border-color: #be185d;
    color: white;
  }

  .color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .color-btn {
    width: 44px;
    height: 44px;
    border: 3px solid #e2e8f0;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .color-btn:hover {
    transform: scale(1.1);
  }
  .color-btn.selected {
    border-color: #be185d;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #be185d;
  }
  .add-color-btn {
    background: #f1f5f9 !important;
    border-color: #e2e8f0 !important;
    color: #64748b !important;
    text-shadow: none !important;
  }
  .add-color-btn:hover {
    border-color: #be185d !important;
    color: #be185d !important;
  }

  /* RGB/HEX Color Picker */
  .rgb-picker {
    margin-top: 12px;
    padding: 16px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
  }
  .rgb-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .rgb-picker-header button {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    padding: 2px;
  }
  .rgb-preview {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    margin-bottom: 12px;
    border: 2px solid #e2e8f0;
  }
  .rgb-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .rgb-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .rgb-field input {
    width: 100%;
    padding: 8px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    text-align: center;
    font-weight: 600;
  }
  .rgb-field input:focus {
    outline: none;
    border-color: #be185d;
  }
  .rgb-hex-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .rgb-hex-row label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .rgb-hex-row input {
    flex: 1;
    padding: 8px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    font-family: monospace;
    font-weight: 600;
  }
  .rgb-hex-row input:focus {
    outline: none;
    border-color: #be185d;
  }
  .rgb-add-btn {
    width: 100%;
    justify-content: center;
    padding: 8px !important;
    font-size: 13px !important;
  }

  /* Stock */
  .stock-matrix {
    border-bottom: none;
    padding-bottom: 0;
  }
  .stock-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stock-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .stock-label {
    min-width: 100px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.1);
    flex-shrink: 0;
  }
  .stock-row input {
    width: 80px;
    padding: 10px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
  }
  .stock-row input:focus {
    outline: none;
    border-color: #be185d;
  }

  .stock-color-group {
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .stock-color-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  .stock-sizes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .stock-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .stock-cell span {
    font-size: 12px;
    color: #64748b;
  }
  .stock-cell input {
    width: 60px;
    padding: 8px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    text-align: center;
  }
  .stock-cell input:focus {
    outline: none;
    border-color: #be185d;
  }

  /* Tags */
  .chip-input-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 10px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    align-items: center;
    min-height: 44px;
    cursor: text;
  }
  .chip-input-wrap:focus-within {
    border-color: #be185d;
    box-shadow: 0 0 0 3px rgba(190, 24, 93, 0.08);
  }
  .text-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: #fdf2f8;
    border: 1px solid #f9a8d4;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #be185d;
  }
  .text-chip button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    color: #be185d;
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
    font-size: 13px;
    padding: 4px;
    background: transparent;
  }

  /* Spectrum Color Picker (XP Paint style) */
  .spectrum-picker {
    margin-top: 12px;
    padding: 16px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
  }
  .spectrum-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .spectrum-header span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .spectrum-header button {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    padding: 2px;
  }
  .spectrum-body {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .spectrum-canvas {
    cursor: crosshair;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    flex: 1;
    height: 180px;
  }
  .hue-bar {
    cursor: pointer;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    width: 24px;
    height: 180px;
  }
  .spectrum-preview-row {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    align-items: stretch;
  }
  .spectrum-color-preview {
    width: 48px;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    flex-shrink: 0;
  }
  .spectrum-inputs {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 6px;
  }
  .spectrum-inputs .rgb-field label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 3px;
    text-transform: uppercase;
  }
  .spectrum-inputs .rgb-field input {
    width: 100%;
    padding: 6px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    text-align: center;
    font-weight: 600;
  }
  .spectrum-inputs .rgb-field input:focus {
    outline: none;
    border-color: #be185d;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }
  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 400px;
    width: 100%;
    text-align: center;
  }
  .modal-content h3 {
    font-size: 20px;
    margin-bottom: 16px;
  }
  .modal-content p {
    color: #64748b;
    margin-bottom: 24px;
  }
  .modal-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  /* ========== RESPONSIVE ========== */

  @media (max-width: 1024px) {
    .product-layout {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .product-panel {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .admin-product-page {
      padding: 12px;
    }

    .admin-header {
      gap: 12px;
    }
    .admin-header-actions {
      width: 100%;
    }
    .admin-header-actions .btn {
      flex: 1;
      justify-content: center;
    }

    .gallery-main {
      aspect-ratio: 1 / 1;
    }

    .gallery-nav {
      width: 36px;
      height: 36px;
    }

    .gallery-thumb {
      width: 64px;
      height: 64px;
    }

    .product-panel {
      padding: 16px;
    }

    .panel-name-input {
      font-size: 18px;
      padding: 12px;
    }

    .panel-price-input input {
      font-size: 18px;
      max-width: 160px;
    }

    .panel-header {
      flex-direction: column;
      gap: 8px;
    }
    .visibility-toggle {
      margin-top: 0;
      width: 100%;
      justify-content: center;
    }

    .size-btn {
      min-width: 44px;
      height: 44px;
    }
    .color-btn {
      width: 40px;
      height: 40px;
    }

    .stock-cell input {
      width: 50px;
    }
    .stock-row input {
      width: 70px;
    }

    .media-color-tabs-list {
      max-width: 100%;
    }
    .media-color-tab {
      padding: 6px 10px;
      font-size: 12px;
    }

    .btn-text {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .admin-product-page {
      padding: 8px;
    }

    .btn {
      padding: 8px 12px;
      font-size: 12px;
    }

    .panel-name-input {
      font-size: 16px;
      padding: 10px;
    }
    .panel-price-input input {
      font-size: 16px;
      max-width: 140px;
    }

    .lang-tabs {
      gap: 2px;
    }
    .lang-tab {
      font-size: 12px;
      padding: 8px;
    }

    .description-section textarea {
      font-size: 13px;
      padding: 10px;
    }

    .rgb-inputs {
      gap: 4px;
    }
    .rgb-field input {
      padding: 6px;
      font-size: 13px;
    }

    .gallery-thumb {
      width: 56px;
      height: 56px;
    }

    .upload-placeholder p {
      font-size: 14px;
    }
    .upload-icon {
      width: 64px;
      height: 64px;
    }
  }
`;
