'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Baby, UtensilsCrossed, Check, RotateCcw } from 'lucide-react';
import {
  FILTER_COLORS,
  FILTER_SIZES,
  PRICE_RANGES,
  type FilterOption,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface FilterState {
  category: string | null;
  sizes: string[];
  colors: string[];
  priceRange: string | null;
  materials: string[];
  patterns: string[];
  gender: string | null;
  kitchenType: string | null;
  sortBy: string;
  searchQuery: string | null;
}

export { type FilterOption };

export interface FilterData {
  sizes: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
  patterns: FilterOption[];
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filterData: FilterData;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  filterData,
}: FilterSidebarProps) {
  const t = useTranslations('shopping.filters');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return (
      (filters.category ? 1 : 0) +
      filters.sizes.length +
      filters.colors.length +
      (filters.priceRange ? 1 : 0) +
      filters.materials.length +
      filters.patterns.length +
      (filters.gender ? 1 : 0) +
      (filters.kitchenType ? 1 : 0)
    );
  }, [filters]);

  // Handlers
  const handleCategoryChange = useCallback((category: string | null) => {
    // Reset category-specific filters when changing category
    onFiltersChange({
      ...filters,
      category,
      sizes: [],
      gender: null,
      kitchenType: null,
      patterns: [],
    });
  }, [filters, onFiltersChange]);

  const handleMultiSelect = useCallback((key: 'sizes' | 'colors' | 'materials' | 'patterns', value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [key]: newValues });
  }, [filters, onFiltersChange]);

  const handleSingleSelect = useCallback((key: 'priceRange' | 'gender' | 'kitchenType', value: string | null) => {
    const currentValue = filters[key];
    onFiltersChange({ 
      ...filters, 
      [key]: currentValue === value ? null : value 
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      category: null,
      sizes: [],
      colors: [],
      priceRange: null,
      materials: [],
      patterns: [],
      gender: null,
      kitchenType: null,
      sortBy: filters.sortBy,
      searchQuery: null,
    });
  }, [filters.sortBy, onFiltersChange]);

  // Use shared sizes and colors from constants (always consistent across the app)
  const availableSizes = FILTER_SIZES;
  const availableColors = FILTER_COLORS;
  const availableMaterials = filterData.materials.length > 0 ? filterData.materials : [];
  const availablePatterns = filterData.patterns.length > 0 ? filterData.patterns : [];

  return (
    <>
      <style jsx>{`
        .filter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .filter-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .filter-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 320px;
          max-width: 85vw;
          background: #fff;
          z-index: 101;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
        }
        [dir="rtl"] .filter-sidebar {
          left: auto;
          right: 0;
          transform: translateX(100%);
        }
        .filter-sidebar.open {
          transform: translateX(0);
        }

        /* Header */
        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
          background: linear-gradient(135deg, #fff5f7 0%, #fff 100%);
        }
        .filter-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .filter-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }
        .filter-badge {
          background: #ff4d81;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          min-width: 20px;
          text-align: center;
        }
        .filter-close {
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f5f5;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.2s ease;
        }
        .filter-close:hover {
          background: #ff4d81;
          color: #fff;
          transform: rotate(90deg);
        }

        /* Content */
        .filter-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        /* Section */
        .filter-section {
          margin-bottom: 28px;
        }
        .filter-section:last-child {
          margin-bottom: 0;
        }
        .filter-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 14px 0;
        }

        /* Category Cards */
        .category-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 16px;
          background: #fafafa;
          border: 2px solid transparent;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .category-card:hover {
          background: #fff5f7;
          border-color: #ffb8c9;
        }
        .category-card.active {
          background: linear-gradient(135deg, #fff0f3 0%, #ffe8ed 100%);
          border-color: #ff4d81;
          box-shadow: 0 4px 12px rgba(255, 77, 129, 0.15);
        }
        .category-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff4d81 0%, #ff8fa3 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: transform 0.2s ease;
        }
        .category-card:hover .category-icon {
          transform: scale(1.05);
        }
        .category-card.active .category-icon {
          box-shadow: 0 4px 12px rgba(255, 77, 129, 0.3);
        }
        .category-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          text-align: center;
        }

        /* Gender Buttons */
        .gender-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .gender-btn {
          padding: 14px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #555;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .gender-btn:hover {
          border-color: #ffb8c9;
          background: #fff9fa;
        }
        .gender-btn.active {
          border-color: #ff4d81;
          background: linear-gradient(135deg, #fff0f3 0%, #ffe8ed 100%);
          color: #ff4d81;
        }
        .gender-btn.girl { color: #e75480; }
        .gender-btn.boy { color: #4a90d9; }
        .gender-btn.active.girl { 
          border-color: #e75480; 
          background: linear-gradient(135deg, #fff0f5 0%, #ffe8ef 100%);
        }
        .gender-btn.active.boy { 
          border-color: #4a90d9; 
          background: linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 100%);
        }

        /* Size Grid */
        .size-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .size-chip {
          padding: 10px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          transition: all 0.2s ease;
        }
        .size-chip:hover {
          border-color: #ffb8c9;
          background: #fff9fa;
        }
        .size-chip.active {
          border-color: #ff4d81;
          background: #ff4d81;
          color: #fff;
        }

        /* Color Swatches */
        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .color-swatch {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.active {
          box-shadow: 0 0 0 3px #ff4d81;
        }
        .color-swatch-check {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .color-swatch.active .color-swatch-check {
          opacity: 1;
        }

        /* Kitchen Type */
        .kitchen-type-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .kitchen-type-btn {
          padding: 14px 18px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #555;
          transition: all 0.2s ease;
          text-align: left;
        }
        .kitchen-type-btn:hover {
          border-color: #ffb8c9;
          background: #fff9fa;
        }
        .kitchen-type-btn.active {
          border-color: #ff4d81;
          background: linear-gradient(135deg, #fff0f3 0%, #ffe8ed 100%);
          color: #ff4d81;
        }

        /* Material Chips */
        .material-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .material-chip {
          padding: 10px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 20px;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          transition: all 0.2s ease;
        }
        .material-chip:hover {
          border-color: #ffb8c9;
          background: #fff9fa;
        }
        .material-chip.active {
          border-color: #ff4d81;
          background: #ff4d81;
          color: #fff;
        }

        /* Price Range */
        .price-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .price-option {
          padding: 14px 18px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #555;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .price-option:hover {
          border-color: #ffb8c9;
          background: #fff9fa;
        }
        .price-option.active {
          border-color: #ff4d81;
          background: linear-gradient(135deg, #fff0f3 0%, #ffe8ed 100%);
          color: #ff4d81;
        }
        .price-check {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .price-option.active .price-check {
          border-color: #ff4d81;
          background: #ff4d81;
          color: #fff;
        }

        /* Footer */
        .filter-footer {
          padding: 16px 24px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          gap: 12px;
          background: #fff;
        }
        .filter-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .filter-btn-clear {
          background: #f5f5f5;
          border: none;
          color: #666;
        }
        .filter-btn-clear:hover:not(:disabled) {
          background: #eee;
          color: #ff4d81;
        }
        .filter-btn-clear:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .filter-btn-apply {
          background: linear-gradient(135deg, #ff4d81 0%, #ff8fa3 100%);
          border: none;
          color: #fff;
          box-shadow: 0 4px 12px rgba(255, 77, 129, 0.3);
        }
        .filter-btn-apply:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(255, 77, 129, 0.4);
        }

        /* Divider */
        .filter-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 24px 0;
        }

        @media (max-width: 480px) {
          .filter-sidebar {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        className={`filter-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="filter-header">
          <div className="filter-header-left">
            <h2 className="filter-title">{t('title')}</h2>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </div>
          <button className="filter-close" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="filter-content">
          {/* STEP 1: Category Selection (Always Visible) */}
          <div className="filter-section">
            <h3 className="filter-section-title">{t('categories')}</h3>
            <div className="category-grid">
              <div
                className={`category-card ${filters.category === 'kids' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('kids')}
                role="button"
                tabIndex={0}
              >
                <div className="category-icon">
                  <Baby size={24} />
                </div>
                <span className="category-label">{t('kidsClothes')}</span>
              </div>
              <div
                className={`category-card ${filters.category === 'kitchen' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('kitchen')}
                role="button"
                tabIndex={0}
              >
                <div className="category-icon">
                  <UtensilsCrossed size={24} />
                </div>
                <span className="category-label">{t('kitchen')}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Conditional Filters based on Category */}
          
          {/* === KIDS DRESSES FILTERS === */}
          {filters.category === 'kids' && (
            <>
              <div className="filter-divider" />
              
              {/* Gender Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">{t('gender')}</h3>
                <div className="gender-grid">
                  <button
                    className={`gender-btn girl ${filters.gender === 'girl' ? 'active' : ''}`}
                    onClick={() => handleSingleSelect('gender', 'girl')}
                  >
                    👧 {t('girl')}
                  </button>
                  <button
                    className={`gender-btn boy ${filters.gender === 'boy' ? 'active' : ''}`}
                    onClick={() => handleSingleSelect('gender', 'boy')}
                  >
                    👦 {t('boy')}
                  </button>
                </div>
              </div>

              {/* Size Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">{t('age')}</h3>
                <div className="size-grid">
                  {availableSizes.map((size) => (
                    <button
                      key={size.code}
                      className={`size-chip ${filters.sizes.includes(size.code) ? 'active' : ''}`}
                      onClick={() => handleMultiSelect('sizes', size.code)}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">{t('color')}</h3>
                <div className="color-grid">
                  {availableColors.map((color) => (
                    <button
                      key={color.code}
                      className={`color-swatch ${filters.colors.includes(color.code) ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex || '#ccc' }}
                      onClick={() => handleMultiSelect('colors', color.code)}
                      title={color.label}
                      aria-label={color.label}
                    >
                      <Check className="color-swatch-check" size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Filter */}
              {availableMaterials.length > 0 && (
                <div className="filter-section">
                  <h3 className="filter-section-title">{t('material')}</h3>
                  <div className="material-grid">
                    {availableMaterials.map((material) => (
                      <button
                        key={material.code}
                        className={`material-chip ${filters.materials.includes(material.code) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('materials', material.code)}
                      >
                        {material.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern Filter */}
              {availablePatterns.length > 0 && (
                <div className="filter-section">
                  <h3 className="filter-section-title">{t('pattern')}</h3>
                  <div className="material-grid">
                    {availablePatterns.map((pattern) => (
                      <button
                        key={pattern.code}
                        className={`material-chip ${filters.patterns.includes(pattern.code) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('patterns', pattern.code)}
                      >
                        {pattern.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* === KITCHEN FILTERS === */}
          {filters.category === 'kitchen' && (
            <>
              <div className="filter-divider" />

              {/* Kitchen Type Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">{t('type')}</h3>
                <div className="kitchen-type-grid">
                  <button
                    className={`kitchen-type-btn ${filters.kitchenType === 'items' ? 'active' : ''}`}
                    onClick={() => handleSingleSelect('kitchenType', 'items')}
                  >
                    🍽️ {t('forItems')}
                  </button>
                  <button
                    className={`kitchen-type-btn ${filters.kitchenType === 'mama' ? 'active' : ''}`}
                    onClick={() => handleSingleSelect('kitchenType', 'mama')}
                  >
                    👩‍🍳 {t('forMama')}
                  </button>
                </div>
              </div>

              {/* Color Filter */}
              <div className="filter-section">
                <h3 className="filter-section-title">{t('color')}</h3>
                <div className="color-grid">
                  {availableColors.map((color) => (
                    <button
                      key={color.code}
                      className={`color-swatch ${filters.colors.includes(color.code) ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex || '#ccc' }}
                      onClick={() => handleMultiSelect('colors', color.code)}
                      title={color.label}
                      aria-label={color.label}
                    >
                      <Check className="color-swatch-check" size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Filter */}
              {availableMaterials.length > 0 && (
                <div className="filter-section">
                  <h3 className="filter-section-title">{t('material')}</h3>
                  <div className="material-grid">
                    {availableMaterials.map((material) => (
                      <button
                        key={material.code}
                        className={`material-chip ${filters.materials.includes(material.code) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('materials', material.code)}
                      >
                        {material.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern Filter */}
              {availablePatterns.length > 0 && (
                <div className="filter-section">
                  <h3 className="filter-section-title">{t('pattern')}</h3>
                  <div className="material-grid">
                    {availablePatterns.map((pattern) => (
                      <button
                        key={pattern.code}
                        className={`material-chip ${filters.patterns.includes(pattern.code) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('patterns', pattern.code)}
                      >
                        {pattern.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="filter-divider" />

          {/* PRICE FILTER (Always at bottom) */}
          <div className="filter-section">
            <h3 className="filter-section-title">{t('price')}</h3>
            <div className="price-grid">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.id}
                  className={`price-option ${filters.priceRange === range.id ? 'active' : ''}`}
                  onClick={() => handleSingleSelect('priceRange', range.id)}
                >
                  <span>{t(`priceRange.${range.id}`)}</span>
                  <span className="price-check">
                    {filters.priceRange === range.id && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="filter-footer">
          <button
            className="filter-btn filter-btn-clear"
            onClick={clearAllFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw size={16} />
            {t('clearAll')}
          </button>
          <button className="filter-btn filter-btn-apply" onClick={onClose}>
            {t('apply')}
          </button>
        </div>
      </aside>
    </>
  );
}
