'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Heart, Scissors, Truck } from 'lucide-react';

export default function OrderingSteps() {
  const t = useTranslations('orderingSteps');
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    { icon: Heart, key: 'choose' },
    { icon: Scissors, key: 'sewPack' },
    { icon: Truck, key: 'ship' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const stepElements = sectionRef.current?.querySelectorAll('.steps-step');
    stepElements?.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx>{`
        .steps-section {
          padding: var(--spacing-4xl) 0;
          background: var(--color-surface);
        }
        .steps-container {
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          max-width: var(--content-max-width);
        }
        .steps-header {
          text-align: center;
          margin-bottom: var(--spacing-md);
        }
        .steps-title {
          font-size: var(--font-size-3xl);
          font-style: var(--font-style-heading);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          line-height: var(--line-height-heading);
        }
        .steps-subtitle {
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
          line-height: var(--line-height-body);
          color: var(--color-on-surface-secondary);
          margin-top: var(--spacing-sm);
        }
        .steps-grid {
          gap: var(--spacing-3xl);
          display: flex;
          margin-top: var(--spacing-4xl);
          justify-content: center;
        }
        .steps-step {
          flex: 1;
          max-width: 320px;
          position: relative;
          text-align: center;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .steps-step.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .steps-step:nth-child(2) {
          transition-delay: 0.15s;
        }
        .steps-step:nth-child(3) {
          transition-delay: 0.3s;
        }
        .steps-icon-wrapper {
          width: 100px;
          height: 100px;
          margin: 0 auto var(--spacing-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 2px dashed var(--color-primary);
          background: color-mix(in oklab, var(--color-primary) 10%, var(--color-surface));
          transition: all 0.3s ease;
        }
        .steps-step:hover .steps-icon-wrapper {
          transform: scale(1.1);
          border-style: solid;
          box-shadow: 0 10px 30px color-mix(in oklab, var(--color-primary) 20%, transparent);
        }
        .steps-step-title {
          font-size: var(--font-size-lg);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          margin-bottom: var(--spacing-sm);
        }
        .steps-step-description {
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
          line-height: var(--line-height-body);
          color: var(--color-on-surface-secondary);
        }
        @media (max-width: 767px) {
          .steps-grid {
            gap: var(--spacing-4xl);
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <section className="steps-section" ref={sectionRef}>
        <div className="steps-container">
          <div className="steps-header">
            <h2 className="steps-title">{t('title')}</h2>
            <p className="steps-subtitle">{t('subtitle')}</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="steps-step">
                  <div className="steps-icon-wrapper">
                    <IconComponent size={40} color="var(--color-primary)" strokeWidth={1.5} />
                  </div>
                  <h3 className="steps-step-title">{index + 1}. {t(`steps.${step.key}.title`)}</h3>
                  <p className="steps-step-description">{t(`steps.${step.key}.description`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
