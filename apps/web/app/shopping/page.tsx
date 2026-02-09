'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, Clock, TrendingUp, ArrowUpDown, Star } from 'lucide-react';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { 
  FilterSidebar, 
  ProductGrid, 
  type FilterState, 
  type FilterData,
  type Product 
} from '@/components/shopping';
import { getCache, setCache, generateCacheKey } from '@/lib/cache';

const PRODUCTS_PER_PAGE = 12;
const PRODUCTS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache for products
const FILTERS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache for filter options

// Sort options
const SORT_OPTIONS = [
  { id: 'featured', icon: Star, labelKey: 'featured' },
  { id: 'newest', icon: Clock, labelKey: 'newest' },
  { id: 'bestselling', icon: TrendingUp, labelKey: 'bestselling' },
  { id: 'price-asc', icon: ArrowUpDown, labelKey: 'price-asc' },
  { id: 'price-desc', icon: ArrowUpDown, labelKey: 'price-desc' },
];

// Initial filter state (updated for new schema)
const initialFilters: FilterState = {
  category: null,
  sizes: [],
  colors: [],
  priceRange: null,
  materials: [],
  patterns: [],
  gender: null,
  kitchenType: null,
  sortBy: 'featured',
  searchQuery: null,
};

// Initial filter data (will be populated from API)
const initialFilterData: FilterData = {
  sizes: [],
  colors: [],
  materials: [],
  patterns: [],
};

// Transform API product response to grid Product format
interface APIProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  likeCount: number;
  salesCount: number;
  inStock: boolean;
  isFeatured: boolean;
  category: string;
  categorySlug: string;
  colors: Array<{ id: string; code: string; hex: string | null; label: string }>;
  sizes: Array<{ id: string; code: string; label: string }>;
  variants: Array<{
    id: string;
    variantKey: string;
    sku: string;
    price: number | null;
    stock: number;
    sizeId: string | null;
    colorId: string | null;
  }>;
}

function transformProduct(apiProduct: APIProduct): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    price: apiProduct.price,
    compareAtPrice: apiProduct.originalPrice || null,
    description: apiProduct.description || null,
    images: apiProduct.imageUrl ? [
      {
        id: `${apiProduct.id}-primary`,
        url: apiProduct.imageUrl,
        alt: apiProduct.name,
        isPrimary: true,
      }
    ] : [],
    category: {
      slug: apiProduct.categorySlug,
      name: apiProduct.category,
    },
    badges: [
      ...(apiProduct.isFeatured ? ['Best Seller'] : []),
      ...(!apiProduct.inStock ? ['Out of Stock'] : []),
    ],
    rating: apiProduct.rating,
    reviewCount: apiProduct.reviewCount,
    likeCount: apiProduct.likeCount,
    inStock: apiProduct.inStock,
    sizes: apiProduct.sizes,
    colors: apiProduct.colors,
    variants: apiProduct.variants,
  };
}

export default function ShoppingPage() {
  const t = useTranslations('shopping');
  const tFilters = useTranslations('shopping.filters');
  const tSort = useTranslations('shopping.sort');
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [filterData, setFilterData] = useState<FilterData>(initialFilterData);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Sync filters from URL search params — this is the single source of truth
  // for URL-driven filters. Runs on mount and whenever the URL changes.
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');
    const genderFromUrl = searchParams.get('gender');
    const kitchenTypeFromUrl = searchParams.get('kitchenType');
    
    const newCategory = categoryFromUrl && ['kids', 'kitchen'].includes(categoryFromUrl) ? categoryFromUrl : null;
    const newSearch = searchFromUrl || null;
    const newGender = genderFromUrl && ['boy', 'girl'].includes(genderFromUrl) ? genderFromUrl : null;
    const newKitchenType = kitchenTypeFromUrl && ['items', 'mama'].includes(kitchenTypeFromUrl) ? kitchenTypeFromUrl : null;
    
    setFilters(prev => {
      if (prev.category !== newCategory || prev.searchQuery !== newSearch || 
          prev.gender !== newGender || prev.kitchenType !== newKitchenType) {
        return {
          ...prev,
          category: newCategory,
          searchQuery: newSearch,
          gender: newGender,
          kitchenType: newKitchenType,
        };
      }
      return prev;
    });
  }, [searchParams]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters (excluding sort and search)
  const activeFilterCount = 
    (filters.category ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.priceRange ? 1 : 0) +
    filters.materials.length +
    filters.patterns.length +
    (filters.gender ? 1 : 0) +
    (filters.kitchenType ? 1 : 0);

  // Fetch filter options (colors, sizes, materials from database) - with caching
  const fetchFilterData = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = '/api/filters';
      const cached = getCache<FilterData>(cacheKey);
      if (cached) {
        setFilterData(cached);
        return;
      }
      
      const response = await fetch('/api/filters');
      if (response.ok) {
        const data = await response.json();
        const f = data.filters || data;
        const filterDataResult = {
          sizes: f.sizes || [],
          colors: f.colors || [],
          materials: f.materials || [],
          patterns: f.patterns || [],
        };
        setFilterData(filterDataResult);
        // Cache the result
        setCache(cacheKey, filterDataResult, FILTERS_CACHE_TTL);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  }, []);

  // Build query params from filters
  const buildQueryParams = useCallback((pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    params.set('limit', PRODUCTS_PER_PAGE.toString());
    params.set('locale', locale.toUpperCase());
    
    if (filters.searchQuery) {
      params.set('search', filters.searchQuery);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (filters.sizes.length > 0) {
      params.set('sizes', filters.sizes.join(','));
    }
    if (filters.colors.length > 0) {
      params.set('colors', filters.colors.join(','));
    }
    if (filters.priceRange) {
      params.set('priceRange', filters.priceRange);
    }
    if (filters.materials.length > 0) {
      params.set('materials', filters.materials.join(','));
    }
    if (filters.patterns.length > 0) {
      params.set('patterns', filters.patterns.join(','));
    }
    if (filters.gender) {
      params.set('gender', filters.gender);
    }
    if (filters.kitchenType) {
      params.set('kitchenType', filters.kitchenType);
    }
    if (filters.sortBy && filters.sortBy !== 'featured') {
      params.set('sort', filters.sortBy);
    }
    
    return params.toString();
  }, [filters, locale]);

  // Fetch products - with caching for better navigation experience
  // NOTE: products.length removed from deps to prevent infinite re-creation.
  // We use the functional updater form of setProducts + setHasMore to access
  // current length without a stale closure.
  const fetchProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const queryString = buildQueryParams(pageNum);
    const cacheKey = generateCacheKey('/api/products', { query: queryString, page: pageNum });
    
    // Check cache first (only for page 1 with reset, or when loading more pages)
    if (reset && pageNum === 1) {
      const cached = getCache<{ products: APIProduct[]; total: number }>(cacheKey);
      if (cached) {
        const transformedProducts = (cached.products || []).map(transformProduct);
        setProducts(transformedProducts);
        setTotalProducts(cached.total || transformedProducts.length);
        setHasMore(transformedProducts.length === PRODUCTS_PER_PAGE && transformedProducts.length < (cached.total || Infinity));
        setPage(pageNum);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/products?${queryString}`, {
        signal: controller.signal,
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      
      // Cache the response (only cache page 1 results for clean refreshes)
      if (pageNum === 1) {
        setCache(cacheKey, data, PRODUCTS_CACHE_TTL);
      }
      
      // Transform products to grid format
      const transformedProducts = (data.products || []).map(transformProduct);
      const total = data.total || transformedProducts.length;
      
      if (reset) {
        setProducts(transformedProducts);
        setHasMore(transformedProducts.length === PRODUCTS_PER_PAGE && transformedProducts.length < total);
      } else {
        setProducts(prev => {
          const merged = [...prev, ...transformedProducts];
          // Compute hasMore using the merged length (avoids stale closure)
          setHasMore(transformedProducts.length === PRODUCTS_PER_PAGE && merged.length < total);
          return merged;
        });
      }
      
      setTotalProducts(total);
      setPage(pageNum);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests — don't touch loading state
      }
      console.error('Error fetching products:', error);
    }

    // Only clear loading if this request wasn't aborted
    if (!controller.signal.aborted) {
      setIsLoading(false);
    }
  }, [buildQueryParams]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    setFilters((prev: FilterState) => ({ ...prev, sortBy }));
    setIsSortOpen(false);
  }, []);

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchProducts(page + 1, false);
    }
  }, [isLoading, hasMore, page, fetchProducts]);

  // Clear a specific filter chip
  const clearFilter = useCallback((filterType: keyof FilterState, value?: string) => {
    setFilters((prev: FilterState) => {
      if (filterType === 'category' || filterType === 'priceRange' || filterType === 'gender' || filterType === 'kitchenType' || filterType === 'searchQuery') {
        return { ...prev, [filterType]: null };
      }
      if (filterType === 'sortBy') {
        return { ...prev, sortBy: 'featured' };
      }
      const currentArray = prev[filterType] as string[];
      if (value) {
        return { ...prev, [filterType]: currentArray.filter((v: string) => v !== value) };
      }
      return { ...prev, [filterType]: [] };
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever filters change (including on initial mount)
  // We use a ref to track the serialized filters to avoid double-fetching
  const lastFetchedFiltersRef = useRef<string>('');
  useEffect(() => {
    const serialized = JSON.stringify(filters);
    if (serialized === lastFetchedFiltersRef.current) {
      return; // Already fetched with these exact filters
    }
    lastFetchedFiltersRef.current = serialized;
    fetchProducts(1, true);

    // On cleanup (StrictMode unmount), reset the ref so the next mount retries.
    // Also abort the in-flight fetch so it doesn't set stale state.
    return () => {
      lastFetchedFiltersRef.current = '';
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, fetchProducts]);

  // Get label for filter value
  const getFilterLabel = (type: string, value: string): string => {
    switch (type) {
      case 'category':
        return tFilters(value === 'kids' ? 'kidsClothes' : 'kitchen');
      case 'sizes':
        return filterData.sizes.find((s: { code: string; label: string }) => s.code === value)?.label || value;
      case 'colors':
        return filterData.colors.find((c: { code: string; label: string }) => c.code === value)?.label || value;
      case 'priceRange':
        return tFilters(`priceRange.${value}`);
      case 'materials':
        return filterData.materials.find((m: { code: string; label: string }) => m.code === value)?.label || value;
      case 'patterns':
        return filterData.patterns.find((p: { code: string; label: string }) => p.code === value)?.label || value;
      case 'gender':
        return tFilters(value);
      case 'kitchenType':
        return tFilters(value === 'items' ? 'forItems' : 'forMama');
      default:
        return value;
    }
  };

  // Current sort option
  const currentSort = SORT_OPTIONS.find(opt => opt.id === filters.sortBy) || SORT_OPTIONS[0]!;
  const CurrentSortIcon = currentSort.icon;

  return (
    <>
      <style jsx>{`
        .shopping-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .shopping-content {
          flex: 1;
          background: linear-gradient(180deg, #FFF8FA 0%, #fff 100%);
        }
        .shopping-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 20px;
        }
        .shopping-header {
          margin-bottom: 24px;
        }
        .shopping-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 16px 0 8px;
        }

        /* Toolbar */
        .shopping-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 24px;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Filter Button */
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: #fff;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          border-color: #ff4d81;
          color: #ff4d81;
        }
        .filter-btn.has-filters {
          border-color: #ff4d81;
          background: #fff0f3;
        }
        .filter-badge {
          background: #ff4d81;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
        }

        /* Sort Dropdown */
        .sort-dropdown {
          position: relative;
        }
        .sort-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #fff;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: all 0.2s ease;
          min-width: 180px;
          justify-content: space-between;
        }
        .sort-btn:hover {
          border-color: #ff4d81;
        }
        .sort-btn.open {
          border-color: #ff4d81;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .sort-btn-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sort-btn-icon {
          color: #ff4d81;
        }
        .sort-chevron {
          color: #888;
          transition: transform 0.2s ease;
        }
        .sort-btn.open .sort-chevron {
          transform: rotate(180deg);
        }
        .sort-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 2px solid #ff4d81;
          border-top: none;
          border-radius: 0 0 12px 12px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(255, 77, 129, 0.15);
        }
        .sort-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #555;
          transition: all 0.15s ease;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .sort-option:hover {
          background: #fff5f7;
          color: #ff4d81;
        }
        .sort-option.active {
          background: #fff0f3;
          color: #ff4d81;
          font-weight: 600;
        }
        .sort-option-icon {
          color: #999;
        }
        .sort-option.active .sort-option-icon,
        .sort-option:hover .sort-option-icon {
          color: #ff4d81;
        }

        /* Active Filters */
        .active-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #fff0f3;
          border: 1px solid #ffb8c9;
          border-radius: 20px;
          font-size: 13px;
          color: #ff4d81;
          font-weight: 500;
        }
        .filter-chip.search-chip {
          background: #e8f4fc;
          border-color: #a8d4f0;
          color: #2980b9;
        }
        .filter-chip.search-chip .filter-chip-remove {
          background: #2980b9;
        }
        .filter-chip.search-chip .filter-chip-remove:hover {
          background: #1a5276;
        }
        .filter-chip-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border: none;
          background: #ff4d81;
          color: #fff;
          border-radius: 50%;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s ease;
        }
        .filter-chip-remove:hover {
          background: #e63d6b;
          transform: scale(1.1);
        }

        /* Results Count */
        .results-count {
          font-size: 14px;
          color: #888;
          white-space: nowrap;
        }

        /* Products Section */
        .shopping-main {
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .shopping-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .toolbar-left {
            order: 2;
          }
          .toolbar-right {
            order: 1;
            justify-content: space-between;
          }
          .sort-btn {
            min-width: 0;
            flex: 1;
          }
          .shopping-container {
            padding: 16px;
          }
          .shopping-title {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="shopping-page">
        <Header />
        
        <main className="shopping-content">
          <div className="shopping-container">
            {/* Breadcrumb & Title */}
            <div className="shopping-header">
              <Breadcrumb />
              <h1 className="shopping-title">{t('title')}</h1>
            </div>

            {/* Toolbar */}
            <div className="shopping-toolbar">
              <div className="toolbar-left">
                {/* Filter Button */}
                <button
                  className={`filter-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
                  onClick={() => setIsFilterOpen(true)}
                >
                  <SlidersHorizontal size={18} />
                  <span>{t('showFilters')}</span>
                  {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                  )}
                </button>

                {/* Active Filter Chips */}
                {(activeFilterCount > 0 || filters.searchQuery) && (
                  <div className="active-filters">
                    {filters.searchQuery && (
                      <span className="filter-chip search-chip">
                        🔍 &ldquo;{filters.searchQuery}&rdquo;
                        <button className="filter-chip-remove" onClick={() => clearFilter('searchQuery')}>
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {filters.category && (
                      <span className="filter-chip">
                        {getFilterLabel('category', filters.category)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('category')}>
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {filters.gender && (
                      <span className="filter-chip">
                        {getFilterLabel('gender', filters.gender)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('gender')}>
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {filters.kitchenType && (
                      <span className="filter-chip">
                        {getFilterLabel('kitchenType', filters.kitchenType)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('kitchenType')}>
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {filters.priceRange && (
                      <span className="filter-chip">
                        {getFilterLabel('priceRange', filters.priceRange)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('priceRange')}>
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {filters.sizes.map((size: string) => (
                      <span key={size} className="filter-chip">
                        {getFilterLabel('sizes', size)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('sizes', size)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {filters.colors.map((color: string) => (
                      <span key={color} className="filter-chip">
                        {getFilterLabel('colors', color)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('colors', color)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {filters.materials.map((material: string) => (
                      <span key={material} className="filter-chip">
                        {getFilterLabel('materials', material)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('materials', material)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {filters.patterns.map((pattern: string) => (
                      <span key={pattern} className="filter-chip">
                        {getFilterLabel('patterns', pattern)}
                        <button className="filter-chip-remove" onClick={() => clearFilter('patterns', pattern)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="toolbar-right">
                {/* Results Count */}
                <span className="results-count">
                  {t('results', { count: totalProducts })}
                </span>

                {/* Sort Dropdown */}
                <div className="sort-dropdown" ref={sortRef}>
                  <button
                    className={`sort-btn ${isSortOpen ? 'open' : ''}`}
                    onClick={() => setIsSortOpen(!isSortOpen)}
                  >
                    <span className="sort-btn-left">
                      <CurrentSortIcon size={16} className="sort-btn-icon" />
                      <span>{tSort(currentSort.labelKey)}</span>
                    </span>
                    <ChevronDown size={16} className="sort-chevron" />
                  </button>
                  
                  {isSortOpen && (
                    <div className="sort-menu">
                      {SORT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            className={`sort-option ${filters.sortBy === option.id ? 'active' : ''}`}
                            onClick={() => handleSortChange(option.id)}
                          >
                            <Icon size={16} className="sort-option-icon" />
                            <span>{tSort(option.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="shopping-main">
              <ProductGrid
                products={products}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          </div>
        </main>

        <Footer />

        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterData={filterData}
        />
      </div>
    </>
  );
}
