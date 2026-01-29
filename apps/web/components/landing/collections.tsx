'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState, useCallback } from 'react';
import SafeLink from '@/components/shared/SafeLink';
import { getCache, setCache } from '@/lib/cache';

interface CategoryCount {
  slug: string;
  count: number;
}

const COLLECTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function Collections() {
  const t = useTranslations('collections');
  const tc = useTranslations('common');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const hasFetched = useRef(false);

  // Fetch category product counts - with caching
  const fetchCategoryCounts = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cacheKey = `category-counts-${locale}`;
    
    // Check cache first
    const cached = getCache<Record<string, number>>(cacheKey);
    if (cached) {
      setCategoryCounts(cached);
      return;
    }

    try {
      // Fetch counts for kids and kitchen categories
      const [kidsRes, kitchenRes] = await Promise.all([
        fetch(`/api/products?category=kids&locale=${locale.toUpperCase()}&limit=1`),
        fetch(`/api/products?category=kitchen&locale=${locale.toUpperCase()}&limit=1`)
      ]);

      const [kidsData, kitchenData] = await Promise.all([
        kidsRes.json(),
        kitchenRes.json()
      ]);

      const counts = {
        kids: kidsData.total || 0,
        kitchen: kitchenData.total || 0
      };
      
      setCategoryCounts(counts);
      // Cache the counts
      setCache(cacheKey, counts, COLLECTIONS_CACHE_TTL);
    } catch (error) {
      console.error('Failed to fetch category counts:', error);
      // Keep default counts on error
    }
  }, [locale]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Fetch counts when section becomes visible
            fetchCategoryCounts();
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.collection-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [fetchCategoryCounts]);

  // Format count display
  const formatCount = (slug: string) => {
    const count = categoryCounts[slug];
    if (count === undefined) return '...';
    if (count === 0) return tc('noItems') || 'No items';
    return `${count} ${count === 1 ? tc('item') || 'item' : tc('items') || 'items'}`;
  };

  return (
    <>
      <style jsx>{`
        .collections-section {
          padding: 100px 0;
          background: linear-gradient(180deg, #fff 0%, #fdf8f9 50%, #fff 100%);
          position: relative;
          overflow: hidden;
        }
        .collections-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 60%;
          height: 100%;
          background: radial-gradient(ellipse, rgba(255, 107, 157, 0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .collections-section::after {
          content: '';
          position: absolute;
          bottom: -30%;
          right: -10%;
          width: 50%;
          height: 80%;
          background: radial-gradient(ellipse, rgba(255, 179, 71, 0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .collections-container {
          margin: 0 auto;
          padding: 0 24px;
          max-width: var(--content-max-width);
          position: relative;
          z-index: 1;
        }
        .collections-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .collections-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 179, 71, 0.1) 100%);
          border-radius: 50px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #FF6B9D;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .collections-title {
          color: #1a1a1a;
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 16px;
          font-family: var(--font-family-heading);
          background: linear-gradient(135deg, #1a1a1a 0%, #444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .collections-subtitle {
          color: #666;
          font-size: 18px;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .collections-grid {
          display: grid;
          gap: 32px;
          grid-template-columns: repeat(2, 1fr);
        }
        .collection-card {
          display: block;
          overflow: hidden;
          background: #fff;
          text-decoration: none;
          border-radius: 28px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.06);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateY(40px);
          position: relative;
          border: 1px solid rgba(255, 107, 157, 0.08);
        }
        .collection-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .collection-card:nth-child(2) {
          transition-delay: 0.15s;
        }
        .collection-card:hover {
          transform: translateY(-12px) scale(1.01);
          box-shadow: 0 30px 60px rgba(255, 107, 157, 0.18), 0 10px 20px rgba(0, 0, 0, 0.06);
          border-color: rgba(255, 107, 157, 0.2);
        }
        .collection-image-wrapper {
          height: 320px;
          overflow: hidden;
          position: relative;
        }
        .collection-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .collection-card:hover .collection-image {
          transform: scale(1.1);
        }
        .collection-overlay {
          inset: 0;
          position: absolute;
          background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .collection-card:hover .collection-overlay {
          opacity: 1;
        }
        .collection-tag {
          position: absolute;
          top: 20px;
          left: 20px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          color: #FF6B9D;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .collection-content {
          padding: 32px;
          position: relative;
        }
        .collection-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 32px;
          right: 32px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 107, 157, 0.2), transparent);
        }
        .collection-name {
          color: #1a1a1a;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 12px;
          font-family: var(--font-family-heading);
          transition: color 0.3s ease;
        }
        .collection-card:hover .collection-name {
          color: #FF6B9D;
        }
        .collection-description {
          color: #666;
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .collection-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .collection-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 24px;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%);
          border-radius: 50px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        .collection-link:hover {
          transform: translateX(4px);
          box-shadow: 0 6px 25px rgba(255, 107, 157, 0.4);
        }
        .collection-link-arrow {
          transition: transform 0.3s ease;
        }
        .collection-card:hover .collection-link-arrow {
          transform: translateX(4px);
        }
        .collection-count {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #999;
          font-size: 13px;
        }
        .collection-count-dot {
          width: 6px;
          height: 6px;
          background: #FF6B9D;
          border-radius: 50%;
        }

        @media (max-width: 900px) {
          .collections-section {
            padding: 80px 0;
          }
          .collections-header {
            margin-bottom: 48px;
          }
          .collections-title {
            font-size: 32px;
          }
          .collections-subtitle {
            font-size: 16px;
          }
          .collections-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .collection-image-wrapper {
            height: 260px;
          }
          .collection-content {
            padding: 28px;
          }
          .collection-name {
            font-size: 22px;
          }
          .collection-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <section className="collections-section" ref={sectionRef}>
        <div className="collections-container">
          <div className="collections-header">
            <span className="collections-badge">
              Our Collections
            </span>
            <h2 className="collections-title">{t('title')}</h2>
            <p className="collections-subtitle">
              Handcrafted pieces made with love for your little ones and your home. Each item tells a story of artisan craftsmanship.
            </p>
          </div>
          
          <div className="collections-grid">
            <SafeLink href="/shopping?category=kids" newTab={false} className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-tag">For Kids</span>
                <img
                  alt={t('kidsDresses.imageAlt')}
                  src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=1500"
                  className="collection-image"
                />
                <div className="collection-overlay" />
              </div>
              <div className="collection-content">
                <h3 className="collection-name">{t('kidsDresses.title')}</h3>
                <p className="collection-description">{t('kidsDresses.description')}</p>
                <div className="collection-footer">
                  <span className="collection-link">
                    {tc('viewCollection')}
                    <svg className="collection-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                  <span className="collection-count">
                    <span className="collection-count-dot" />
                    {formatCount('kids')}
                  </span>
                </div>
              </div>
            </SafeLink>

            <SafeLink href="/shopping?category=kitchen" newTab={false} className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-tag">For Kitchen</span>
                <img
                  alt={t('homeTextiles.imageAlt')}
                  src="https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=1500"
                  className="collection-image"
                />
                <div className="collection-overlay" />
              </div>
              <div className="collection-content">
                <h3 className="collection-name">{t('homeTextiles.title')}</h3>
                <p className="collection-description">{t('homeTextiles.description')}</p>
                <div className="collection-footer">
                  <span className="collection-link">
                    {tc('viewCollection')}
                    <svg className="collection-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                  <span className="collection-count">
                    <span className="collection-count-dot" />
                    {formatCount('kitchen')}
                  </span>
                </div>
              </div>
            </SafeLink>
          </div>
        </div>
      </section>
    </>
  );
}
