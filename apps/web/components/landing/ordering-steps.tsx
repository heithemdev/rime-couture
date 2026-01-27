import { useTranslations } from 'next-intl';
import styles from './ordering-steps.module.css';

export default function OrderingSteps() {
  const t = useTranslations('orderingSteps');

  const steps = [
    { icon: '📐', key: 'measure' },
    { icon: '🎨', key: 'customize' },
    { icon: '✂️', key: 'craft' },
    { icon: '📦', key: 'deliver' },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.icon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{t(`steps.${step.key}.title`)}</h3>
              <p className={styles.stepDescription}>{t(`steps.${step.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
