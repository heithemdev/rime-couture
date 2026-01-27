import { useTranslations } from 'next-intl';
import styles from './hero.module.css';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <div className={styles.text}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
            <div className={styles.actions}>
              <a href="#shop">
                <button className="btn btn-primary btn-xl">{t('shopNow')}</button>
              </a>
              <a href="#story">
                <button className="btn btn-outline btn-xl">{t('ourStory')}</button>
              </a>
            </div>
          </div>
        </div>
        <div className={styles.imageContainer}>
          <img
            alt={t('imageAlt')}
            src="https://images.pexels.com/photos/5499680/pexels-photo-5499680.jpeg?auto=compress&cs=tinysrgb&w=1500"
            className={styles.image}
          />
          <div className={styles.overlay}></div>
        </div>
      </div>
    </section>
  );
}
