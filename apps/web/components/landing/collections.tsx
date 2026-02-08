'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState, useCallback } from 'react';
import SafeLink from '@/components/shared/SafeLink';
import { getCache, setCache } from '@/lib/cache';

const COLLECTIONS_CACHE_TTL = 5 * 60 * 1000;

export default function Collections() {
  const t = useTranslations('collections');
  const tc = useTranslations('common');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const hasFetched = useRef(false);

  const fetchCategoryCounts = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const cacheKey = `category-counts-${locale}`;
    const cached = getCache<Record<string, number>>(cacheKey);
    if (cached) {
      setCategoryCounts(cached);
      return;
    }

    try {
      const [kidsRes, kitchenRes] = await Promise.all([
        fetch(`/api/products?category=kids&locale=${locale.toUpperCase()}&limit=1`),
        fetch(`/api/products?category=kitchen&locale=${locale.toUpperCase()}&limit=1`)
      ]);
      const [kidsData, kitchenData] = await Promise.all([
        kidsRes.json(),
        kitchenRes.json()
      ]);
      const counts = { kids: kidsData.total || 0, kitchen: kitchenData.total || 0 };
      setCategoryCounts(counts);
      setCache(cacheKey, counts, COLLECTIONS_CACHE_TTL);
    } catch (error) {
      console.error('Failed to fetch category counts:', error);
    }
  }, [locale]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fetchCategoryCounts();
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.col-card');
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [fetchCategoryCounts]);

  const formatCount = (slug: string) => {
    const count = categoryCounts[slug];
    if (count === undefined) return '...';
    if (count === 0) return tc('noItems') || 'No items';
    return `${count} ${count === 1 ? tc('item') || 'item' : tc('items') || 'items'}`;
  };

  return (
    <>
      <style jsx>{`
        .col-section {
          padding: 80px 0;
          background: #fff;
        }
        .col-container {
          margin: 0 auto;
          padding: 0 24px;
          max-width: var(--content-max-width);
        }
        .col-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .col-title {
          font-size: var(--font-size-3xl);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .col-subtitle {
          font-size: 16px;
          color: #777;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .col-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .col-card {
          display: block;
          text-decoration: none;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #eee5e0;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
        }
        .col-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .col-card:nth-child(2) {
          transition-delay: 0.1s;
        }
        .col-card:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        .col-image-wrap {
          position: relative;
          height: 300px;
          overflow: hidden;
        }
        .col-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .col-card:hover .col-image {
          transform: scale(1.04);
        }
        .col-tag {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 6px 14px;
          background: #fff;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-family-heading);
          color: var(--color-primary, #e8627c);
          letter-spacing: 0.3px;
        }
        .col-body {
          padding: 24px;
        }
        .col-name {
          font-size: 20px;
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .col-desc {
          font-size: 14px;
          color: #777;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .col-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .col-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-primary, #e8627c);
          transition: gap 0.2s ease;
        }
        .col-card:hover .col-link {
          gap: 12px;
        }
        .col-count {
          font-size: 13px;
          color: #999;
        }

        @media (max-width: 768px) {
          .col-section { padding: 56px 0; }
          .col-header { margin-bottom: 40px; }
          .col-grid { grid-template-columns: 1fr; gap: 20px; }
          .col-image-wrap { height: 240px; }
          .col-body { padding: 20px; }
          .col-name { font-size: 18px; }
        }
      `}</style>

      <section className="col-section" ref={sectionRef}>
        <div className="col-container">
          <div className="col-header">
            <h2 className="col-title">{t('title')}</h2>
            <p className="col-subtitle">{t('kidsDresses.description')}</p>
          </div>

          <div className="col-grid">
            <SafeLink href="/shopping?category=kids" newTab={false} className="col-card">
              <div className="col-image-wrap">
                <span className="col-tag">{t('kidsDresses.title')}</span>
                <img
                  alt={t('kidsDresses.imageAlt')}
                  src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=1500"
                  className="col-image"
                  loading="lazy"
                />
              </div>
              <div className="col-body">
                <h3 className="col-name">{t('kidsDresses.title')}</h3>
                <p className="col-desc">{t('kidsDresses.description')}</p>
                <div className="col-footer">
                  <span className="col-link">
                    {tc('viewCollection')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                  <span className="col-count">{formatCount('kids')}</span>
                </div>
              </div>
            </SafeLink>

            <SafeLink href="/shopping?category=kitchen" newTab={false} className="col-card">
              <div className="col-image-wrap">
                <span className="col-tag">{t('homeTextiles.title')}</span>
                <img
                  alt={t('homeTextiles.imageAlt')}
                  src="https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=1500"
                  className="col-image"
                  loading="lazy"
                />
              </div>
              <div className="col-body">
                <h3 className="col-name">{t('homeTextiles.title')}</h3>
                <p className="col-desc">{t('homeTextiles.description')}</p>
                <div className="col-footer">
                  <span className="col-link">
                    {tc('viewCollection')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                  <span className="col-count">{formatCount('kitchen')}</span>
                </div>
              </div>
            </SafeLink>
          </div>
        </div>
      </section>
    </>
  );
}
