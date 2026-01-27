'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import styles from './testimonials.module.css';

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
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
          <div className={styles.nav}>
            <button
              className={styles.carouselBtn}
              aria-label={tc('previous')}
              onClick={() => scrollCarousel('left')}
            >
              ‹
            </button>
            <button
              className={styles.carouselBtn}
              aria-label={tc('next')}
              onClick={() => scrollCarousel('right')}
            >
              ›
            </button>
          </div>
        </div>
        <div className={styles.carousel} ref={carouselRef}>
          {reviews.map((review) => (
            <div key={review.key} className={styles.card}>
              <div className={styles.cardHeader}>
                <img
                  src={review.image}
                  alt={t(`reviews.${review.key}.name`)}
                  className={styles.avatar}
                />
                <div className={styles.meta}>
                  <h4 className={styles.name}>{t(`reviews.${review.key}.name`)}</h4>
                  <p className={styles.location}>{t(`reviews.${review.key}.location`)}</p>
                </div>
              </div>
              <div className={styles.stars}>{'★'.repeat(review.rating)}</div>
              <p className={styles.text}>{t(`reviews.${review.key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
