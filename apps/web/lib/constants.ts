/**
 * Shared Constants — Single Source of Truth
 * ==========================================
 * All color, size, category, and tag constants live here.
 * Every file in the project imports from this module instead of
 * defining its own duplicate maps.
 *
 * The Prisma schema is the #1 standard. Values here match what
 * is stored in the database (Color.code, Size.code, Category.slug).
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PresetColor {
  /** Frontend component ID (used in admin forms) */
  id: string;
  /** DB Color.code — unique key in the database */
  code: string;
  /** Hex fallback when DB Color.hex is null */
  hex: string;
  /** English display label */
  label: string;
}

export interface PresetSize {
  /** Frontend component ID (used in admin forms) */
  id: string;
  /** DB Size.code — unique key in the database */
  code: string;
}

export interface PresetCategory {
  /** Frontend component ID (used in admin forms) */
  id: string;
  /** DB Category.slug — unique key in the database */
  slug: string;
  /** English display label */
  name: string;
}

export interface FilterOption {
  code: string;
  label: string;
  hex?: string | null;
}

// ============================================================================
// COLORS — matches DB Color.code values
// ============================================================================

export const PRESET_COLORS: PresetColor[] = [
  { id: 'clr-black',    code: 'black',    hex: '#000000', label: 'Black' },
  { id: 'clr-white',    code: 'white',    hex: '#FFFFFF', label: 'White' },
  { id: 'clr-red',      code: 'red',      hex: '#DC2626', label: 'Red' },
  { id: 'clr-pink',     code: 'pink',     hex: '#EC4899', label: 'Pink' },
  { id: 'clr-rose',     code: 'rose',     hex: '#F43F5E', label: 'Rose' },
  { id: 'clr-orange',   code: 'orange',   hex: '#EA580C', label: 'Orange' },
  { id: 'clr-yellow',   code: 'yellow',   hex: '#EAB308', label: 'Yellow' },
  { id: 'clr-green',    code: 'green',    hex: '#16A34A', label: 'Green' },
  { id: 'clr-teal',     code: 'teal',     hex: '#0D9488', label: 'Teal' },
  { id: 'clr-blue',     code: 'blue',     hex: '#2563EB', label: 'Blue' },
  { id: 'clr-navy',     code: 'navy',     hex: '#1E3A5F', label: 'Navy' },
  { id: 'clr-purple',   code: 'purple',   hex: '#7C3AED', label: 'Purple' },
  { id: 'clr-lavender', code: 'lavender', hex: '#A78BFA', label: 'Lavender' },
  { id: 'clr-brown',    code: 'brown',    hex: '#92400E', label: 'Brown' },
  { id: 'clr-beige',    code: 'beige',    hex: '#D4B896', label: 'Beige' },
  { id: 'clr-gray',     code: 'gray',     hex: '#6B7280', label: 'Gray' },
  { id: 'clr-silver',   code: 'silver',   hex: '#C0C0C0', label: 'Silver' },
  { id: 'clr-gold',     code: 'gold',     hex: '#D4A017', label: 'Gold' },
];

// ============================================================================
// SIZES — matches DB Size.code values (kids clothing: 2Y-12Y)
// ============================================================================

export const PRESET_SIZES: PresetSize[] = [
  { id: 'size-2y',  code: '2Y' },
  { id: 'size-3y',  code: '3Y' },
  { id: 'size-4y',  code: '4Y' },
  { id: 'size-5y',  code: '5Y' },
  { id: 'size-6y',  code: '6Y' },
  { id: 'size-7y',  code: '7Y' },
  { id: 'size-8y',  code: '8Y' },
  { id: 'size-9y',  code: '9Y' },
  { id: 'size-10y', code: '10Y' },
  { id: 'size-11y', code: '11Y' },
  { id: 'size-12y', code: '12Y' },
];

// ============================================================================
// CATEGORIES — matches DB Category.slug values
// ============================================================================

export const CATEGORIES: PresetCategory[] = [
  { id: 'cat-kids-clothes',  slug: 'kids-clothes',  name: 'Kids Clothes' },
  { id: 'cat-kitchen-stuff', slug: 'kitchen-stuff', name: 'Kitchen Stuff' },
];

export const SUBCATEGORIES: Record<string, Array<{ id: string; name: string }>> = {
  'cat-kids-clothes': [
    { id: 'sub-boy', name: 'Boy' },
    { id: 'sub-girl', name: 'Girl' },
  ],
  'cat-kitchen-stuff': [
    { id: 'sub-for-mama', name: 'For Mama' },
    { id: 'sub-items', name: 'Items' },
  ],
};

// ============================================================================
// CATEGORY FILTER MAP
// The shopping page uses short UI keys ('kids', 'kitchen') but the DB uses
// full slugs ('kids-clothes', 'kitchen-stuff'). This map bridges the gap.
// ============================================================================

/** UI filter key → DB Category.slug */
export const CATEGORY_FILTER_TO_SLUG: Record<string, string> = {
  kids: 'kids-clothes',
  kitchen: 'kitchen-stuff',
};

/** DB Category.slug → UI filter key */
export const CATEGORY_SLUG_TO_FILTER: Record<string, string> = {
  'kids-clothes': 'kids',
  'kitchen-stuff': 'kitchen',
};

// ============================================================================
// DERIVED LOOKUP MAPS (computed once at module load)
// ============================================================================

/**
 * Color code → hex fallback
 * Used by APIs when DB Color.hex is null.
 *  e.g. COLOR_HEX_FALLBACK['navy'] → '#1E3A5F'
 */
export const COLOR_HEX_FALLBACK: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.code, c.hex]),
);

/**
 * Resolve a color's hex value. Prefers DB hex, falls back to constant, then gray.
 */
export function resolveHex(code: string, dbHex: string | null): string {
  return dbHex || COLOR_HEX_FALLBACK[code.toLowerCase()] || '#888888';
}

/**
 * Frontend ID → DB Color.code
 *  e.g. COLOR_CODE_MAP['clr-navy'] → 'navy'
 */
export const COLOR_CODE_MAP: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.id, c.code]),
);

/**
 * Frontend ID → hex value
 *  e.g. COLOR_HEX_MAP['clr-navy'] → '#1E3A5F'
 */
export const COLOR_HEX_MAP: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.id, c.hex]),
);

/**
 * DB Color.code → Frontend ID
 *  e.g. COLOR_CODE_TO_FRONTEND['navy'] → 'clr-navy'
 */
export const COLOR_CODE_TO_FRONTEND: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.code, c.id]),
);

/**
 * Frontend ID → DB Size.code
 *  e.g. SIZE_CODE_MAP['size-2y'] → '2Y'
 */
export const SIZE_CODE_MAP: Record<string, string> = Object.fromEntries(
  PRESET_SIZES.map((s) => [s.id, s.code]),
);

/**
 * DB Size.code → Frontend ID
 *  e.g. SIZE_CODE_TO_FRONTEND['2Y'] → 'size-2y'
 */
export const SIZE_CODE_TO_FRONTEND: Record<string, string> = Object.fromEntries(
  PRESET_SIZES.map((s) => [s.code, s.id]),
);

/**
 * Frontend ID → DB Category.slug
 *  e.g. CATEGORY_SLUG_MAP['cat-kids-clothes'] → 'kids-clothes'
 */
export const CATEGORY_SLUG_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.slug]),
);

/**
 * DB Category.slug → Frontend ID
 *  e.g. CATEGORY_SLUG_TO_FRONTEND['kids-clothes'] → 'cat-kids-clothes'
 */
export const CATEGORY_SLUG_TO_FRONTEND: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.id]),
);

// ============================================================================
// FILTER-FRIENDLY SHAPES (used by FilterSidebar)
// ============================================================================

/** Colors as FilterOption[] for the filter sidebar */
export const FILTER_COLORS: FilterOption[] = PRESET_COLORS.map((c) => ({
  code: c.code,
  hex: c.hex,
  label: c.label,
}));

/** Sizes as FilterOption[] for the filter sidebar */
export const FILTER_SIZES: FilterOption[] = PRESET_SIZES.map((s) => ({
  code: s.code,
  label: s.code,
}));

// ============================================================================
// PRICE RANGES
// ============================================================================

export const PRICE_RANGES = [
  { id: 'under2000',    label: '< 2,000 DZD' },
  { id: '2000to5000',   label: '2,000 - 5,000 DZD' },
  { id: '5000to10000',  label: '5,000 - 10,000 DZD' },
  { id: 'over10000',    label: '> 10,000 DZD' },
] as const;
