'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales, LOCALE_LABEL } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import SafeLink from '@/components/shared/SafeLink';
import { useCart } from '@/lib/cart-context';
import { useNavigating } from '@/lib/use-navigating';
import { Search, ShoppingCart, User, Truck, X, Menu, ChevronDown, Sparkles } from 'lucide-react';
import AuthModal from '@/components/shared/authModal';
import type { AuthMode, AuthUser } from '@/components/shared/authModal';

export default function Header() {
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { push } = useNavigating();
  const { items } = useCart();
  // Show number of unique products in cart, not total quantity
  const cartItemCount = items.length;
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [smartSearchPrompt, setSmartSearchPrompt] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const smartSearchRef = useRef<HTMLTextAreaElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  /* ---- Check auth status on mount ---- */
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setAuthUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        setIsScrolled(currentY > 20);
        /* Only hide/show after scrolling past 80px to avoid flickering at top */
        if (currentY > 80) {
          /* Scrolling DOWN → hide header */
          if (currentY > lastScrollY.current + 5) {
            setIsHeaderHidden(true);
          }
          /* Scrolling UP → show header */
          else if (currentY < lastScrollY.current - 5) {
            setIsHeaderHidden(false);
          }
        } else {
          setIsHeaderHidden(false);
        }
        lastScrollY.current = currentY;
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSmartSearchOpen && smartSearchRef.current) {
      smartSearchRef.current.focus();
    }
  }, [isSmartSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const shouldLockScroll = isMobileMenuOpen || isSmartSearchOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isSmartSearchOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setUserLocale(newLocale);
    });
    setIsLangOpen(false);
  };

  // Smart search that detects categories and filters
  const buildSmartSearchUrl = (query: string): string => {
    const normalized = query.trim().toLowerCase();
    const params = new URLSearchParams();
    
    // Category detection patterns (multilingual)
    const categoryPatterns: Record<string, string[]> = {
      kids: ['kids', 'kid', 'children', 'child', 'enfant', 'enfants', 'أطفال', 'طفل', 'dress', 'dresses', 'robe', 'robes', 'فستان', 'فساتين', 'girl', 'girls', 'fille', 'filles', 'بنت', 'بنات', 'boy', 'boys', 'garçon', 'garcons', 'ولد', 'أولاد'],
      kitchen: ['kitchen', 'cuisine', 'مطبخ', 'table', 'tablecloth', 'nappe', 'مفرش', 'apron', 'tablier', 'مريول', 'home', 'maison', 'منزل', 'textile', 'textiles'],
    };
    
    // Gender detection
    const genderPatterns: Record<string, string[]> = {
      girl: ['girl', 'girls', 'fille', 'filles', 'بنت', 'بنات', 'feminine', 'feminin'],
      boy: ['boy', 'boys', 'garçon', 'garcons', 'ولد', 'أولاد', 'masculine', 'masculin'],
    };
    
    // Kitchen type detection
    const kitchenTypePatterns: Record<string, string[]> = {
      items: ['table', 'tablecloth', 'nappe', 'مفرش', 'cloth', 'cover'],
      mama: ['apron', 'tablier', 'مريول', 'mom', 'mama', 'mother'],
    };
    
    let detectedCategory: string | null = null;
    let detectedGender: string | null = null;
    let detectedKitchenType: string | null = null;
    let remainingSearch = normalized;
    
    // Detect category
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern)) {
          detectedCategory = category;
          // Remove the category keyword from search to avoid redundancy
          remainingSearch = remainingSearch.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), '').trim();
          break;
        }
      }
      if (detectedCategory) break;
    }
    
    // Detect gender (only for kids category)
    if (detectedCategory === 'kids' || !detectedCategory) {
      for (const [gender, patterns] of Object.entries(genderPatterns)) {
        for (const pattern of patterns) {
          if (normalized.includes(pattern)) {
            detectedGender = gender;
            remainingSearch = remainingSearch.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), '').trim();
            break;
          }
        }
        if (detectedGender) break;
      }
    }
    
    // Detect kitchen type (only for kitchen category)
    if (detectedCategory === 'kitchen' || !detectedCategory) {
      for (const [type, patterns] of Object.entries(kitchenTypePatterns)) {
        for (const pattern of patterns) {
          if (normalized.includes(pattern)) {
            detectedKitchenType = type;
            if (!detectedCategory) detectedCategory = 'kitchen';
            remainingSearch = remainingSearch.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), '').trim();
            break;
          }
        }
        if (detectedKitchenType) break;
      }
    }
    
    // Build URL params
    if (detectedCategory) params.set('category', detectedCategory);
    if (detectedGender) params.set('gender', detectedGender);
    if (detectedKitchenType) params.set('kitchenType', detectedKitchenType);
    
    // Clean up remaining search (remove extra spaces)
    remainingSearch = remainingSearch.replace(/\s+/g, ' ').trim();
    if (remainingSearch) params.set('search', remainingSearch);
    
    const queryString = params.toString();
    return queryString ? `/shopping?${queryString}` : '/shopping';
  };

  const handleSmartSearchSubmit = () => {
    if (smartSearchPrompt.trim()) {
      push(buildSmartSearchUrl(smartSearchPrompt));
      setIsSmartSearchOpen(false);
      setSmartSearchPrompt('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      push(buildSmartSearchUrl(searchQuery));
      setSearchQuery('');
    }
  };

  return (
    <>
      <style jsx>{`
        .header-wrapper {
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          position: fixed;
          transition: transform 0.35s ease, box-shadow 0.3s ease;
          background-color: var(--color-surface);
          font-family: var(--font-work-sans), 'Work Sans', sans-serif;
          will-change: transform;
        }
        .header-wrapper.scrolled {
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
        }
        .header-wrapper.header-hidden {
          transform: translateY(-100%);
        }
        .header-container {
          margin: 0 auto;
          padding: 0 24px;
          max-width: var(--content-max-width);
        }
        .header-main {
          height: 72px;
          display: flex;
          gap: 24px;
          align-items: center;
          justify-content: space-between;
        }
        
        /* Brand */
        /* Updated to support SafeLink explicitly */
        :global(.header-brand) {
          flex-shrink: 0;
          color: #FF6B9D;
          text-decoration: none;
          font-size: 32px;
          font-family: var(--font-pacifico), 'Pacifico', cursive;
          font-weight: 400;
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        :global(.header-brand:hover) {
          transform: scale(1.03);
        }
        
        /* Search Area */
        .header-search-area {
          flex: 1;
          display: flex;
          gap: 12px;
          max-width: 520px;
          align-items: center;
        }
        .header-search-form {
          flex: 1;
          height: 44px;
          display: flex;
          align-items: stretch;
          border-radius: 22px;
          overflow: hidden;
          background: #f8f8f8;
          border: 2px solid #eee;
          transition: all 0.3s ease;
        }
        .header-search-form:focus-within {
          border-color: #FF6B9D;
          background: #fff;
        }
        .header-search-btn {
          width: 44px;
          border: none;
          cursor: pointer;
          display: flex;
          flex-shrink: 0;
          color: #fff;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          transition: all 0.3s ease;
          align-items: center;
          justify-content: center;
        }
        .header-search-btn:hover {
          opacity: 0.9;
        }
        .header-search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 16px;
          font-size: 14px;
          background: transparent;
          min-width: 0;
        }
        .header-search-input::placeholder {
          color: #999;
        }
        .header-smart-search-btn {
          height: 44px;
          gap: 6px;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          padding: 0 20px;
          font-size: 14px;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          transition: all 0.3s ease;
          align-items: center;
          white-space: nowrap;
          font-weight: 500;
          border-radius: 22px;
        }
        .header-smart-search-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.35);
        }
        
        /* Actions */
        .header-actions {
          gap: 8px;
          display: flex;
          align-items: center;
        }
        /* Added :global to ensure SafeLink picks up styles properly */
        :global(.header-action-btn) {
          width: 42px;
          height: 42px;
          color: #333;
          border: none;
          cursor: pointer;
          display: flex;
          position: relative;
          background: transparent;
          transition: all 0.2s ease;
          align-items: center;
          border-radius: 12px;
          justify-content: center;
          text-decoration: none;
        }
        :global(.header-action-btn:hover) {
          color: #FF6B9D;
          background: rgba(255, 107, 157, 0.1);
        }

        /* NEW: Wrapper to fix icon positioning */
        .icon-relative-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-cart-badge {
          /* Adjusted to be relative to the icon wrapper, not the button */
          top: -5px; 
          right: -5px;
          color: #fff;
          min-width: 18px;
          height: 18px;
          display: flex;
          position: absolute;
          font-size: 10px;
          background: #FF6B9D;
          align-items: center;
          font-weight: 700;
          border-radius: 9px;
          justify-content: center;
          line-height: 1;
          padding: 0 4px;
          box-shadow: 0 2px 4px rgba(255, 107, 157, 0.3);
          border: 2px solid var(--color-surface, #fff); /* Optional: adds a small border to separate from icon */
        }
        
        /* Language Switcher */
        .header-lang-switcher {
          position: relative;
          margin-left: 8px;
        }
        .header-lang-trigger {
          height: 36px;
          gap: 4px;
          color: #333;
          cursor: pointer;
          display: flex;
          padding: 0 12px;
          font-size: 13px;
          align-items: center;
          transition: all 0.2s ease;
          font-weight: 500;
          border-radius: 8px;
          background: transparent;
          border: 1px solid #ddd;
        }
        .header-lang-trigger:hover {
          border-color: #FF6B9D;
          color: #FF6B9D;
        }
        .header-lang-dropdown {
          top: calc(100% + 6px);
          right: 0;
          border: 1px solid #eee;
          display: flex;
          z-index: 100;
          overflow: hidden;
          position: absolute;
          min-width: 110px;
          background: #fff;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-radius: 12px;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
        }
        .header-lang-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .header-lang-option {
          color: #333;
          border: none;
          cursor: pointer;
          padding: 12px 16px;
          font-size: 14px;
          background: transparent;
          transition: all 0.2s ease;
          text-align: left;
        }
        .header-lang-option:hover {
          color: #FF6B9D;
          background: #fafafa;
        }
        .header-lang-option.active {
          color: #FF6B9D;
          font-weight: 600;
          background: rgba(255, 107, 157, 0.08);
        }
        
        /* Mobile Toggle */
        .header-toggle {
          width: 42px;
          height: 42px;
          color: #FF6B9D;
          border: none;
          cursor: pointer;
          display: none;
          background: rgba(255, 107, 157, 0.1);
          border-radius: 12px;
          align-items: center;
          justify-content: center;
        }
        
        /* Smart Search Modal */
        .smart-search-overlay {
          inset: 0;
          display: flex;
          opacity: 0;
          z-index: 2000;
          position: fixed;
          background: rgba(0, 0, 0, 0.6);
          transition: opacity 0.3s ease;
          align-items: flex-start;
          padding-top: 12vh;
          justify-content: center;
          pointer-events: none;
          backdrop-filter: blur(8px);
        }
        .smart-search-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .smart-search-modal {
          width: 90%;
          padding: 28px;
          max-width: 560px;
          transform: translateY(-20px) scale(0.95);
          background: #fff;
          transition: transform 0.3s ease;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
          border-radius: 20px;
        }
        .smart-search-overlay.active .smart-search-modal {
          transform: translateY(0) scale(1);
        }
        .smart-search-header {
          display: flex;
          margin-bottom: 20px;
          align-items: center;
          justify-content: space-between;
        }
        .smart-search-title {
          gap: 10px;
          color: #222;
          display: flex;
          font-size: 20px;
          align-items: center;
          font-weight: 600;
        }
        .smart-search-title-icon {
          color: #FF6B9D;
        }
        .smart-search-close {
          width: 36px;
          height: 36px;
          color: #666;
          border: none;
          cursor: pointer;
          display: flex;
          background: #f5f5f5;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .smart-search-close:hover {
          color: #333;
          background: #eee;
        }
        .smart-search-textarea {
          width: 100%;
          border: 2px solid #eee;
          resize: none;
          padding: 16px;
          font-size: 15px;
          min-height: 120px;
          transition: border-color 0.3s ease;
          line-height: 1.6;
          border-radius: 14px;
          background: #fafafa;
        }
        .smart-search-textarea:focus {
          outline: none;
          border-color: #FF6B9D;
          background: #fff;
        }
        .smart-search-textarea::placeholder {
          color: #999;
        }
        .smart-search-hint {
          color: #888;
          margin: 12px 0 20px;
          font-size: 13px;
        }
        .smart-search-actions {
          gap: 12px;
          display: flex;
          justify-content: flex-end;
        }
        .smart-search-cancel {
          height: 44px;
          color: #666;
          border: 1px solid #ddd;
          cursor: pointer;
          padding: 0 24px;
          font-size: 14px;
          background: transparent;
          transition: all 0.2s ease;
          font-weight: 500;
          border-radius: 22px;
        }
        .smart-search-cancel:hover {
          border-color: #999;
          background: #f5f5f5;
        }
        .smart-search-submit {
          height: 44px;
          gap: 6px;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          padding: 0 24px;
          font-size: 14px;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          transition: all 0.3s ease;
          align-items: center;
          font-weight: 500;
          border-radius: 22px;
        }
        .smart-search-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.35);
        }
        .smart-search-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Menu - Completely Redesigned */
        .mobile-menu-overlay {
          inset: 0;
          opacity: 0;
          z-index: 1500;
          position: fixed;
          background: rgba(0, 0, 0, 0.5);
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .mobile-menu-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .mobile-menu {
          top: 0;
          left: 0;
          width: 320px;
          height: 100%;
          z-index: 1600;
          position: fixed;
          background: #fff;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .mobile-menu.active {
          transform: translateX(0);
        }
        .mobile-menu-header {
          display: flex;
          padding: 20px;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(255, 107, 157, 0.05) 0%, rgba(255, 179, 71, 0.05) 100%);
        }
        .mobile-menu-brand {
          color: #FF6B9D;
          font-size: 28px;
          font-family: var(--font-pacifico), 'Pacifico', cursive;
          font-weight: 400;
        }
        .mobile-menu-close {
          width: 40px;
          height: 40px;
          color: #666;
          border: none;
          cursor: pointer;
          display: flex;
          background: #fff;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }
        .mobile-menu-close:hover {
          color: #FF6B9D;
          transform: rotate(90deg);
        }
        .mobile-menu-body {
          flex: 1;
          padding: 24px 20px;
          overflow-y: auto;
        }
        
        /* Mobile Search */
        .mobile-search-wrapper {
          margin-bottom: 24px;
        }
        .mobile-search-form {
          display: flex;
          height: 48px;
          align-items: stretch;
          border-radius: 14px;
          overflow: hidden;
          background: #f5f5f5;
          border: 2px solid #eee;
        }
        .mobile-search-form:focus-within {
          border-color: #FF6B9D;
          background: #fff;
        }
        .mobile-search-btn {
          width: 48px;
          border: none;
          cursor: pointer;
          display: flex;
          flex-shrink: 0;
          color: #fff;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          align-items: center;
          justify-content: center;
        }
        .mobile-search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 16px;
          font-size: 15px;
          background: transparent;
        }
        .mobile-search-input::placeholder {
          color: #999;
        }
        .mobile-smart-search-btn {
          width: 100%;
          height: 48px;
          gap: 8px;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          margin-top: 12px;
          font-size: 15px;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          transition: all 0.3s ease;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          border-radius: 14px;
        }
        .mobile-smart-search-btn:hover {
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.35);
        }
        
        /* Mobile Nav */
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-nav-item {
          display: flex;
          height: 52px;
          gap: 14px;
          color: #333;
          padding: 0 16px;
          font-size: 16px;
          font-weight: 500;
          align-items: center;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
          background: #fafafa;
        }
        .mobile-nav-item:hover {
          color: #FF6B9D;
          background: rgba(255, 107, 157, 0.1);
        }
        .mobile-nav-icon {
          width: 40px;
          height: 40px;
          display: flex;
          color: #FF6B9D;
          background: rgba(255, 107, 157, 0.1);
          border-radius: 12px;
          align-items: center;
          justify-content: center;
        }
        
        /* Mobile Footer */
        .mobile-menu-footer {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
          background: #fafafa;
        }
        .mobile-lang-label {
          color: #888;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mobile-lang-options {
          display: flex;
          gap: 8px;
        }
        .mobile-lang-btn {
          flex: 1;
          height: 40px;
          color: #333;
          border: 2px solid #eee;
          cursor: pointer;
          font-size: 14px;
          background: #fff;
          transition: all 0.2s ease;
          font-weight: 500;
          border-radius: 10px;
        }
        .mobile-lang-btn:hover {
          border-color: #FF6B9D;
          color: #FF6B9D;
        }
        .mobile-lang-btn.active {
          color: #fff;
          border-color: #FF6B9D;
          background: #FF6B9D;
        }

        @media (max-width: 991px) {
          .header-main {
            height: 64px;
          }
          .header-search-area {
            max-width: 380px;
          }
        }
        @media (max-width: 767px) {
          .header-container {
            padding: 0 16px;
          }
          .header-main {
            height: 60px;
          }
          .header-search-area {
            display: none;
          }
          .header-toggle {
            display: flex;
          }
          .header-lang-switcher {
            display: none;
          }
          .header-action-btn.desktop-only {
            display: none;
          }
        }
      `}</style>

      <div style={{ height: '72px', flexShrink: 0 }} />
      <nav className={`header-wrapper ${isScrolled ? 'scrolled' : ''} ${isHeaderHidden ? 'header-hidden' : ''}`}>
        <div className="header-container">
          <div className="header-main">
            {/* Mobile Toggle */}
            <button
              className="header-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={tc('openMenu')}
            >
              <Menu size={22} />
            </button>

            {/* Brand - Fixed to be a Link */}
            <SafeLink href="/" className="header-brand">
              Rimoucha
            </SafeLink>

            {/* Search Area */}
            <div className="header-search-area">
              <form className="header-search-form" onSubmit={handleSearch}>
                <button type="submit" className="header-search-btn">
                  <Search size={18} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="header-search-input"
                  placeholder={tc('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <button
                className="header-smart-search-btn"
                onClick={() => setIsSmartSearchOpen(true)}
              >
                <Sparkles size={16} />
                {tc('smartSearch')}
              </button>
            </div>

            {/* Actions */}
            <div className="header-actions">
              <button
                type="button"
                className="header-action-btn desktop-only"
                aria-label={tc('myAccount')}
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              >
                <User size={22} />
              </button>
              
              {/* Cart Button Fixed */}
              <SafeLink
                href="/cart"
                newTab={false}
                className="header-action-btn header-cart-btn"
                aria-label={tc('shoppingCart')}
              >
                {/* Wrapped icon in a relative div so badge positions relative to ICON, not button */}
                <div className="icon-relative-wrapper">
                  <ShoppingCart size={22} />
                  {cartItemCount > 0 && (
                    <span className="header-cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
                  )}
                </div>
              </SafeLink>

              <SafeLink
                href="/orders"
                newTab={false}
                className="header-action-btn desktop-only"
                aria-label={tc('myOrders')}
              >
                <Truck size={22} />
              </SafeLink>
              
              <div className="header-lang-switcher" ref={langRef}>
                <button
                  className="header-lang-trigger"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  style={{ opacity: isPending ? 0.5 : 1 }}
                >
                  {LOCALE_LABEL[locale]}
                  <ChevronDown size={14} style={{ transform: isLangOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>
                <div className={`header-lang-dropdown ${isLangOpen ? 'open' : ''}`}>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      className={`header-lang-option ${loc === locale ? 'active' : ''}`}
                      onClick={() => handleLocaleChange(loc)}
                      disabled={isPending}
                    >
                      {LOCALE_LABEL[loc]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Smart Search Modal */}
      <div 
        className={`smart-search-overlay ${isSmartSearchOpen ? 'active' : ''}`}
        onClick={(e) => e.target === e.currentTarget && setIsSmartSearchOpen(false)}
      >
        <div className="smart-search-modal">
          <div className="smart-search-header">
            <h2 className="smart-search-title">
              <Sparkles size={22} className="smart-search-title-icon" />
              {tc('smartSearchTitle')}
            </h2>
            <button 
              className="smart-search-close" 
              onClick={() => setIsSmartSearchOpen(false)}
              aria-label={tc('close')}
            >
              <X size={20} />
            </button>
          </div>
          <textarea
            ref={smartSearchRef}
            className="smart-search-textarea"
            placeholder={tc('smartSearchPlaceholder')}
            value={smartSearchPrompt}
            onChange={(e) => setSmartSearchPrompt(e.target.value)}
          />
          <p className="smart-search-hint">{tc('smartSearchHint')}</p>
          <div className="smart-search-actions">
            <button 
              className="smart-search-cancel"
              onClick={() => {
                setIsSmartSearchOpen(false);
                setSmartSearchPrompt('');
              }}
            >
              {tc('cancel')}
            </button>
            <button 
              className="smart-search-submit"
              onClick={handleSmartSearchSubmit}
              disabled={!smartSearchPrompt.trim()}
            >
              <Sparkles size={16} />
              {tc('search')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-brand">Rimoucha</span>
          <button
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={tc('closeMenu')}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mobile-menu-body">
          {/* Mobile Search */}
          <div className="mobile-search-wrapper">
            <form className="mobile-search-form" onSubmit={handleSearch}>
              <button type="submit" className="mobile-search-btn">
                <Search size={20} />
              </button>
              <input
                type="text"
                className="mobile-search-input"
                placeholder={tc('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button
              className="mobile-smart-search-btn"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSmartSearchOpen(true);
              }}
            >
              <Sparkles size={18} />
              {tc('smartSearch')}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="mobile-nav">
            <button 
              type="button"
              className="mobile-nav-item" 
              onClick={() => { setIsMobileMenuOpen(false); setAuthMode('login'); setIsAuthModalOpen(true); }}
            >
              <span className="mobile-nav-icon">
                <User size={20} />
              </span>
              {tc('myAccount')}
            </button>
            <SafeLink 
              href="/cart" 
              newTab={false} 
              className="mobile-nav-item" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-nav-icon">
                <ShoppingCart size={20} />
              </span>
              {tc('shoppingCart')}
            </SafeLink>
            <SafeLink 
              href="/orders" 
              newTab={false} 
              className="mobile-nav-item" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-nav-icon">
                <Truck size={20} />
              </span>
              {tc('myOrders')}
            </SafeLink>
          </nav>
        </div>
        
        {/* Mobile Footer */}
        <div className="mobile-menu-footer">
          <p className="mobile-lang-label">{tc('language')}</p>
          <div className="mobile-lang-options">
            {locales.map((loc) => (
              <button
                key={loc}
                className={`mobile-lang-btn ${loc === locale ? 'active' : ''}`}
                onClick={() => handleLocaleChange(loc)}
                disabled={isPending}
              >
                {LOCALE_LABEL[loc]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onToggleMode={() => setAuthMode((m: AuthMode) => (m === 'login' ? 'signup' : 'login'))}
        currentUser={authUser}
        onAuthSuccess={(user) => { setAuthUser(user); }}
        onLogout={() => { setAuthUser(null); }}
      />
    </>
  );
}