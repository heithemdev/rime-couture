import { useTranslations } from 'next-intl';
import styles from './collections.module.css';

export default function Collections() {
  const t = useTranslations('collections');
  const tc = useTranslations('common');

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('title')}</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                alt={t('kidsDresses.imageAlt')}
                src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=1500"
                className={styles.image}
              />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{t('kidsDresses.title')}</h3>
              <p className={styles.cardDescription}>{t('kidsDresses.description')}</p>
              <a href="#kids" className={styles.cardLink}>
                {tc('viewCollection')}
              </a>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                alt={t('homeTextiles.imageAlt')}
                src="https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=1500"
                className={styles.image}
              />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{t('homeTextiles.title')}</h3>
              <p className={styles.cardDescription}>{t('homeTextiles.description')}</p>
              <a href="#home" className={styles.cardLink}>
                {tc('viewCollection')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
