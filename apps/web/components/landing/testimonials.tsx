'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const tc = useTranslations('common');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 400;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const reviews = [
    {
      key: 'sarah',
      rating: 5,
      image:
        'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      key: 'amira',
      rating: 5,
      image:
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      key: 'fatima',
      rating: 5,
      image:
        'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ];

  return (
    <>
      <style jsx>{`
        .testimonials-section {
          padding: var(--spacing-4xl) 0;
          background-color: var(--color-surface);
        }
        .testimonials-container {
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          max-width: var(--content-max-width);
        }
        .testimonials-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-3xl);
        }
        .testimonials-title {
          font-size: var(--font-size-3xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
        }
        .testimonials-nav {
          gap: var(--spacing-sm);
          display: flex;
        }
        .testimonials-carousel-btn {
          width: 40px;
          height: 40px;
          border: 1px solid var(--color-border);
          cursor: pointer;
          display: flex;
          font-size: var(--font-size-2xl);
          background: var(--color-surface);
          transition: all 0.2s ease;
          align-items: center;
          border-radius: var(--border-radius-full);
          justify-content: center;
        }
        .testimonials-carousel-btn:hover {
          color: var(--color-on-primary);
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .testimonials-carousel {
          gap: var(--spacing-2xl);
          display: flex;
          overflow-x: auto;
          padding-bottom: var(--spacing-xl);
          scrollbar-width: none;
        }
        .testimonials-carousel::-webkit-scrollbar {
          display: none;
        }
        .testimonials-card {
          flex: 0 0 400px;
          padding: var(--spacing-2xl);
          background: var(--color-surface-elevated);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
          border-radius: var(--border-radius-card);
        }
        .testimonials-card-header {
          gap: var(--spacing-lg);
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }
        .testimonials-avatar {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 50%;
        }
        .testimonials-meta {
          display: flex;
          flex-direction: column;
        }
        .testimonials-name {
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-medium);
        }
        .testimonials-location {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
        }
        .testimonials-stars {
          gap: 2px;
          color: var(--color-accent);
          display: flex;
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-md);
        }
        .testimonials-text {
          color: var(--color-on-surface-secondary);
          line-height: 1.7;
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
        }
        @media (max-width: 767px) {
          .testimonials-card {
            flex: 0 0 300px;
          }
        }
      `}</style>

      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <h2 className="testimonials-title">{t('title')}</h2>
            <div className="testimonials-nav">
              <button
                className="testimonials-carousel-btn"
                aria-label={tc('previous')}
                onClick={() => scrollCarousel('left')}
              >
                ‹
              </button>
              <button
                className="testimonials-carousel-btn"
                aria-label={tc('next')}
                onClick={() => scrollCarousel('right')}
              >
                ›
              </button>
            </div>
          </div>
          <div className="testimonials-carousel" ref={carouselRef}>
            {reviews.map((review) => (
              <div key={review.key} className="testimonials-card">
                <div className="testimonials-card-header">
                  <img
                    src={review.image}
                    alt={t(`reviews.${review.key}.name`)}
                    className="testimonials-avatar"
                  />
                  <div className="testimonials-meta">
                    <h4 className="testimonials-name">{t(`reviews.${review.key}.name`)}</h4>
                    <p className="testimonials-location">{t(`reviews.${review.key}.location`)}</p>
                  </div>
                </div>
                <div className="testimonials-stars">{'★'.repeat(review.rating)}</div>
                <p className="testimonials-text">{t(`reviews.${review.key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
