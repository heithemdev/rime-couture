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
            entry.target.classList.add('in-view');
            fetchCategoryCounts();
          }
        });
      },
      { threshold: 0.12 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [fetchCategoryCounts]);

  const formatCount = (slug: string) => {
    const count = categoryCounts[slug];
    if (count === undefined) return null;
    if (count === 0) return null;
    return `${count} ${count === 1 ? tc('item') || 'item' : tc('items') || 'items'}`;
  };

  return (
    <>
      <style jsx>{`
        .cx {
          padding: 96px 0;
          background: #fff;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .cx.in-view {
          opacity: 1;
          transform: none;
        }
        .cx-inner {
          margin: 0 auto;
          padding: 0 24px;
          max-width: var(--content-max-width);
        }

        /* heading row */
        .cx-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          gap: 24px;
        }
        .cx-heading {
          font-size: var(--font-size-3xl);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.15;
          margin: 0;
          max-width: 420px;
        }
        .cx-tagline {
          font-size: 14px;
          color: #999;
          line-height: 1.5;
          margin: 0;
          flex-shrink: 0;
          padding-bottom: 4px;
        }

        /* asymmetric layout */
        .cx-layout {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 20px;
          align-items: stretch;
        }

        /* card base */
        .cx-card {
          display: block;
          text-decoration: none;
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
        }
        .cx-card:focus-visible {
          outline: 2px solid var(--color-primary, #ff4d81);
          outline-offset: 3px;
        }

        /* image */
        .cx-img-box {
          width: 100%;
          aspect-ratio: auto;
          overflow: hidden;
          border-radius: 14px;
        }
        .cx-card-a .cx-img-box { height: 440px; }
        .cx-card-b .cx-img-box { height: 440px; }

        .cx-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease;
          filter: brightness(0.97);
        }
        .cx-card:hover .cx-img {
          transform: scale(1.05);
          filter: brightness(0.92);
        }

        /* count pill floating on image */
        .cx-pill {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 2;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.2px;
          color: #fff;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(10px);
        }

        /* text block below image */
        .cx-info {
          padding: 20px 4px 0;
        }
        .cx-name {
          font-size: 19px;
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .cx-desc {
          font-size: 14px;
          color: #888;
          line-height: 1.6;
          margin: 0 0 14px;
        }

        /* CTA link */
        .cx-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-primary, #ff4d81);
          letter-spacing: 0.2px;
          position: relative;
        }
        .cx-cta::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: var(--color-primary, #ff4d81);
          transition: width 0.3s ease;
        }
        .cx-card:hover .cx-cta::after {
          width: 100%;
        }
        .cx-cta svg {
          transition: transform 0.25s ease;
        }
        .cx-card:hover .cx-cta svg {
          transform: translateX(3px);
        }

        /* responsive */
        @media (max-width: 820px) {
          .cx { padding: 64px 0; }
          .cx-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 36px;
          }
          .cx-layout {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .cx-card-a .cx-img-box,
          .cx-card-b .cx-img-box {
            height: 280px;
          }
        }

        @media (max-width: 480px) {
          .cx { padding: 48px 0; }
          .cx-inner { padding: 0 16px; }
          .cx-card-a .cx-img-box,
          .cx-card-b .cx-img-box {
            height: 240px;
          }
          .cx-img-box { border-radius: 12px; }
          .cx-info { padding: 16px 2px 0; }
          .cx-name { font-size: 17px; }
        }
      `}</style>

      <section className="cx" ref={sectionRef}>
        <div className="cx-inner">
          <div className="cx-top">
            <h2 className="cx-heading">{t('title')}</h2>
            <p className="cx-tagline">{t('kidsDresses.description')}</p>
          </div>

          <div className="cx-layout">
            <SafeLink href="/shopping?category=kids" newTab={false} className="cx-card cx-card-a">
              <div className="cx-img-box">
                <img
                  src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=900"
                  alt={t('kidsDresses.imageAlt')}
                  className="cx-img"
                  loading="lazy"
                />
              </div>
              {formatCount('kids') && (
                <span className="cx-pill">{formatCount('kids')}</span>
              )}
              <div className="cx-info">
                <h3 className="cx-name">{t('kidsDresses.title')}</h3>
                <p className="cx-desc">{t('kidsDresses.description')}</p>
                <span className="cx-cta">
                  {tc('viewCollection')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </SafeLink>

            <SafeLink href="/shopping?category=kitchen" newTab={false} className="cx-card cx-card-b">
              <div className="cx-img-box">
                <img
                  src="https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=900"
                  alt={t('homeTextiles.imageAlt')}
                  className="cx-img"
                  loading="lazy"
                />
              </div>
              {formatCount('kitchen') && (
                <span className="cx-pill">{formatCount('kitchen')}</span>
              )}
              <div className="cx-info">
                <h3 className="cx-name">{t('homeTextiles.title')}</h3>
                <p className="cx-desc">{t('homeTextiles.description')}</p>
                <span className="cx-cta">
                  {tc('viewCollection')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </SafeLink>
          </div>
        </div>
      </section>
    </>
  );
}
