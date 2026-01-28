'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Shield, Star, Package, Truck, Heart, CheckCircle } from 'lucide-react';

export default function TrustFeatures() {
  const t = useTranslations('trustFeatures');
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    { icon: Shield, key: 'safeForKids', color: '#3B82F6' },
    { icon: Star, key: 'familyMade', color: '#F59E0B' },
    { icon: Package, key: 'carefullyPacked', color: '#D97706' },
    { icon: Truck, key: 'fastShipping', color: '#0EA5E9' },
    { icon: Heart, key: 'madeWithLove', color: '#8B5CF6' },
    { icon: CheckCircle, key: 'qualityCheck', color: '#14B8A6' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.trust-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx>{`
        .trust-section {
          padding: var(--spacing-4xl) 0;
          background-color: var(--color-surface-elevated);
        }
        .trust-container {
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          max-width: var(--content-max-width);
        }
        .trust-title {
          font-size: var(--font-size-3xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
          margin-bottom: var(--spacing-3xl);
        }
        .trust-grid {
          gap: var(--spacing-xl);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .trust-card {
          border: 1px solid var(--color-border);
          display: flex;
          padding: var(--spacing-2xl) var(--spacing-xl);
          background: var(--color-surface);
          text-align: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          align-items: center;
          border-radius: var(--border-radius-lg);
          flex-direction: column;
          opacity: 0;
          transform: translateY(30px);
        }
        .trust-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .trust-card:nth-child(1) { transition-delay: 0s; }
        .trust-card:nth-child(2) { transition-delay: 0.1s; }
        .trust-card:nth-child(3) { transition-delay: 0.2s; }
        .trust-card:nth-child(4) { transition-delay: 0.3s; }
        .trust-card:nth-child(5) { transition-delay: 0.4s; }
        .trust-card:nth-child(6) { transition-delay: 0.5s; }
        .trust-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
          border-color: var(--color-secondary);
        }
        .trust-icon-wrapper {
          margin-bottom: var(--spacing-md);
          transition: transform 0.3s ease;
        }
        .trust-card:hover .trust-icon-wrapper {
          transform: scale(1.15);
        }
        .trust-card-title {
          font-size: var(--font-size-lg);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          margin-bottom: var(--spacing-sm);
        }
        .trust-card-description {
          font-size: var(--font-size-sm);
          font-family: var(--font-family-body);
          line-height: var(--line-height-body);
          color: var(--color-on-surface-secondary);
        }
        @media (max-width: 991px) {
          .trust-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 479px) {
          .trust-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="trust-section" ref={sectionRef}>
        <div className="trust-container">
          <h2 className="trust-title">{t('title')}</h2>
          <div className="trust-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="trust-card">
                  <div className="trust-icon-wrapper">
                    <IconComponent size={40} color={feature.color} strokeWidth={1.5} />
                  </div>
                  <h3 className="trust-card-title">{t(`features.${feature.key}.title`)}</h3>
                  <p className="trust-card-description">{t(`features.${feature.key}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
