'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import SafeLink from '@/components/shared/SafeLink';

export default function Hero() {
  const t = useTranslations('hero');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (imageRef.current) {
        const scrolled = window.scrollY;
        const rate = scrolled * 0.4;
        imageRef.current.style.transform = `translateY(${rate}px) scale(1.1)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style jsx>{`
        .hero-section {
          display: flex;
          overflow: hidden;
          position: relative;
          min-height: 100vh;
          align-items: center;
          background: linear-gradient(135deg, #FFE5D3 0%, #FFE2F0 100%);
        }
        .hero-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          position: relative;
        }
        .hero-content {
          flex: 6;
          display: flex;
          padding: var(--spacing-4xl) var(--spacing-3xl);
          z-index: 3;
          position: relative;
          flex-direction: column;
          justify-content: center;
        }
        .hero-image-container {
          flex: 4;
          z-index: 1;
          position: relative;
          overflow: hidden;
          clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        .hero-text {
          max-width: 40rem;
          opacity: 0;
          transform: translateY(30px);
          animation: heroFadeIn 0.8s ease forwards;
          animation-delay: 0.2s;
        }
        @keyframes heroFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-title {
          font-size: var(--font-size-4xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
          letter-spacing: var(--letter-spacing-heading);
          text-transform: var(--text-transform-heading);
        }
        .hero-subtitle {
          opacity: 0.85;
          font-size: var(--font-size-lg);
          margin-top: var(--spacing-lg);
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-body);
          line-height: var(--line-height-body);
        }
        .hero-image {
          width: 100%;
          height: 120%;
          object-fit: cover;
          transform: scale(1.1);
          transition: transform 0.1s ease-out;
          will-change: transform;
        }
        .hero-overlay {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          position: absolute;
          background: linear-gradient(135deg, rgba(255, 229, 211, 0.3) 0%, rgba(255, 226, 240, 0.3) 100%);
          pointer-events: none;
        }
        .hero-actions {
          gap: var(--spacing-md);
          display: flex;
          margin-top: var(--spacing-2xl);
          opacity: 0;
          transform: translateY(20px);
          animation: heroFadeIn 0.8s ease forwards;
          animation-delay: 0.5s;
        }
        @media (max-width: 991px) {
          .hero-wrapper {
            flex-direction: column;
          }
          .hero-content {
            padding: var(--spacing-3xl) var(--spacing-xl);
            text-align: center;
            align-items: center;
          }
          .hero-image-container {
            clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 100%);
            min-height: 40vh;
          }
          .hero-actions {
            justify-content: center;
          }
        }
        :global([dir='rtl']) .hero-content {
          text-align: right;
        }
      `}</style>

      <section className="hero-section" id="hero">
        <div className="hero-wrapper">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">{t('title')}</h1>
              <p className="hero-subtitle">{t('subtitle')}</p>
              <div className="hero-actions">
                <SafeLink href="/shopping" newTab={false}>
                  <button className="btn btn-primary btn-xl">{t('shopNow')}</button>
                </SafeLink>
              </div>
            </div>
          </div>
          <div className="hero-image-container">
            <img
              ref={imageRef}
              alt={t('imageAlt')}
              src="https://images.pexels.com/photos/5499680/pexels-photo-5499680.jpeg?auto=compress&cs=tinysrgb&w=1500"
              className="hero-image"
            />
            <div className="hero-overlay"></div>
          </div>
        </div>
      </section>
    </>
  );
}
