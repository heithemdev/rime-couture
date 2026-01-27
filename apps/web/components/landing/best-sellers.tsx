'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import styles from './best-sellers.module.css';

export default function BestSellers() {
  const t = useTranslations('bestSellers');
  const tc = useTranslations('common');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const products = [
    {
      name: t('products.floralDress.name'),
      price: 45.99,
      originalPrice: 59.99,
      image:
        'https://images.pexels.com/photos/35188/child-childrens-baby-children-s.jpg?auto=compress&cs=tinysrgb&w=800',
      badge: tc('sale'),
    },
    {
      name: t('products.silkPillowcase.name'),
      price: 29.99,
      image:
        'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=800',
      badge: tc('bestSeller'),
    },
    {
      name: t('products.partyDress.name'),
      price: 65.0,
      image:
        'https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=800',
      badge: tc('new'),
    },
    {
      name: t('products.cottonTablecloth.name'),
      price: 39.99,
      image:
        'https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: t('products.summerDress.name'),
      price: 42.0,
      originalPrice: 55.0,
      image:
        'https://images.pexels.com/photos/36029/aroni-arsa-children-little.jpg?auto=compress&cs=tinysrgb&w=800',
      badge: tc('sale'),
    },
  ];

  return (
    <section className={styles.section}>
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
      <div className={styles.carouselContainer} ref={carouselRef}>
        <div className={styles.track}>
          {products.map((product, index) => (
            <div key={index} className={styles.productCard}>
              {product.badge && <span className={styles.badge}>{product.badge}</span>}
              <img alt={product.name} src={product.image} className={styles.productImage} />
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.productFooter}>
                  <span className={styles.price}>${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
