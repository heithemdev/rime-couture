'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export default function TrustFeatures() {
  const t = useTranslations('trustFeatures');
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    { key: 'premiumMaterials', emoji: '🧶' },
    { key: 'looksGreatInPerson', emoji: '👗' },
    { key: 'handSewn', emoji: '🪡' },
    { key: 'twentyYears', emoji: '🏅' },
    { key: 'mothersTouchTitle', emoji: '🤱' },
    { key: 'weGetEachOther', emoji: '💕' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const items = sectionRef.current?.querySelectorAll('.tf-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx>{`
        .tf-section {
          padding: 80px 0;
          background: #faf8f6;
        }
        .tf-container {
          margin: 0 auto;
          padding: 0 24px;
          max-width: var(--content-max-width);
        }
        .tf-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .tf-title {
          font-size: var(--font-size-3xl);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
        }
        .tf-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .tf-item {
          background: #fff;
          border: 1px solid #eee5e0;
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .tf-item.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .tf-item:nth-child(1) { transition-delay: 0s; }
        .tf-item:nth-child(2) { transition-delay: 0.07s; }
        .tf-item:nth-child(3) { transition-delay: 0.14s; }
        .tf-item:nth-child(4) { transition-delay: 0.21s; }
        .tf-item:nth-child(5) { transition-delay: 0.28s; }
        .tf-item:nth-child(6) { transition-delay: 0.35s; }
        .tf-emoji {
          font-size: 36px;
          line-height: 1;
          margin-bottom: 16px;
          display: block;
        }
        .tf-item-title {
          font-size: 16px;
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .tf-item-desc {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }
        @media (max-width: 900px) {
          .tf-section { padding: 64px 0; }
          .tf-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 520px) {
          .tf-section { padding: 48px 0; }
          .tf-header { margin-bottom: 40px; }
          .tf-grid { grid-template-columns: 1fr; gap: 12px; }
          .tf-item { padding: 24px 20px; }
        }
      `}</style>

      <section className="tf-section" id="trust-features" ref={sectionRef}>
        <div className="tf-container">
          <div className="tf-header">
            <h2 className="tf-title">{t('title')}</h2>
          </div>
          <div className="tf-grid">
            {features.map((feature) => (
              <div key={feature.key} className="tf-item">
                <span className="tf-emoji" role="img">{feature.emoji}</span>
                <h3 className="tf-item-title">{t(`features.${feature.key}.title`)}</h3>
                <p className="tf-item-desc">{t(`features.${feature.key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
