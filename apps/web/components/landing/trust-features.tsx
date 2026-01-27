import { useTranslations } from 'next-intl';
import styles from './trust-features.module.css';

export default function TrustFeatures() {
  const t = useTranslations('trustFeatures');

  const features = [
    { icon: '🧵', key: 'quality' },
    { icon: '📏', key: 'customFit' },
    { icon: '❤️', key: 'madeWithLove' },
    { icon: '🚚', key: 'freeShipping' },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('title')}</h2>
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.icon}>{feature.icon}</div>
              <h3 className={styles.cardTitle}>{t(`features.${feature.key}.title`)}</h3>
              <p className={styles.cardDescription}>{t(`features.${feature.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
