import { useTranslations } from 'next-intl';
import styles from './final-cta.module.css';

export default function FinalCta() {
  const t = useTranslations('finalCta');

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.content}>
            <h2 className={styles.title}>{t('title')}</h2>
            <p className={styles.subtitle}>{t('subtitle')}</p>
            <div className={styles.actions}>
              <a href="#shop">
                <button className="btn btn-accent btn-lg">{t('startShopping')}</button>
              </a>
              <span className={styles.guarantee}>{t('guarantee')}</span>
            </div>
          </div>
          <div className={styles.visual}>
            <img
              src="https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt={t('imageAlt')}
              className={styles.image}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
