'use client';

import { useTranslations } from 'next-intl';
import SafeLink from '@/components/shared/SafeLink';

export default function FinalCta() {
  const t = useTranslations('finalCta');

  return (
    <>
      <style jsx>{`
        .cta-section {
          padding: var(--spacing-4xl) var(--spacing-xl);
          background: var(--color-surface);
        }
        .cta-wrapper {
          margin: 0 auto;
          max-width: var(--content-max-width);
        }
        .cta-card {
          display: flex;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            var(--color-primary) 0%,
            color-mix(in srgb, var(--color-primary) 80%, black) 100%
          );
          box-shadow: 0 20px 40px rgba(255, 77, 129, 0.2);
          border-radius: var(--border-radius-xl);
        }
        .cta-content {
          flex: 1;
          color: var(--color-on-primary);
          display: flex;
          padding: var(--spacing-4xl);
          flex-direction: column;
          justify-content: center;
        }
        .cta-title {
          color: var(--color-on-primary);
          font-size: var(--font-size-3xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
        }
        .cta-subtitle {
          color: var(--color-on-primary);
          opacity: 0.9;
          margin-top: var(--spacing-md);
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
          line-height: var(--line-height-body);
        }
        .cta-visual {
          flex: 1;
          position: relative;
        }
        .cta-actions {
          gap: var(--spacing-md);
          display: flex;
          margin-top: var(--spacing-2xl);
          align-items: flex-start;
          flex-direction: column;
        }
        .cta-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cta-guarantee {
          color: var(--color-on-primary);
          opacity: 0.8;
          font-size: var(--font-size-xs);
          font-style: italic;
        }
        @media (max-width: 991px) {
          .cta-card {
            flex-direction: column;
          }
          .cta-content {
            padding: var(--spacing-3xl) var(--spacing-xl);
            text-align: center;
          }
          .cta-visual {
            height: 300px;
          }
          .cta-actions {
            align-items: center;
          }
        }
      `}</style>

      <section className="cta-section">
        <div className="cta-wrapper">
          <div className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">{t('title')}</h2>
              <p className="cta-subtitle">{t('subtitle')}</p>
              <div className="cta-actions">
                <SafeLink href="/shopping" newTab={false}>
                  <button className="btn btn-accent btn-lg">{t('startShopping')}</button>
                </SafeLink>
                <span className="cta-guarantee">{t('guarantee')}</span>
              </div>
            </div>
            <div className="cta-visual">
              <img
                src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt={t('imageAlt')}
                className="cta-image"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
