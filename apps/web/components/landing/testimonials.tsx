'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useCallback } from 'react';

const AUTO_INTERVAL = 5000;

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reviews = [
    { key: 'sarah', initials: 'O', color: '#FF4D81' },
    { key: 'amira', initials: 'A', color: '#25A5A1' },
    { key: 'fatima', initials: 'F', color: '#FFC947' },
  ];

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, AUTO_INTERVAL);
  }, [reviews.length]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    startTimer();
  }, [startTimer]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    startTimer();
  }, [reviews.length, startTimer]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
    startTimer();
  }, [reviews.length, startTimer]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  return (
    <>
      <style jsx>{`
        .test-section {
          padding: 80px 0;
          background: #fff;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .test-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .test-wrapper {
          margin: 0 auto;
          padding: 0 24px;
          max-width: 720px;
        }
        .test-header {
          text-align: center;
          margin-bottom: 12px;
        }
        .test-title {
          font-size: var(--font-size-3xl);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
          margin: 0;
        }
        .test-subtitle {
          font-size: 15px;
          color: #888;
          margin: 8px 0 48px;
        }

        /* chevrons on the sides of the card */
        .test-body {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .test-chevron {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid #e0d8d4;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          flex-shrink: 0;
          padding: 0;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .test-chevron:hover {
          border-color: var(--color-primary, #FF4D81);
          color: var(--color-primary, #FF4D81);
          background: #fff5f7;
        }
        .test-chevron:active {
          transform: scale(0.94);
        }

        /* card */
        .test-showcase {
          flex: 1;
          position: relative;
          min-height: 220px;
        }
        .test-card {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          pointer-events: none;
        }
        .test-card.active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
          position: relative;
        }

        .test-quote {
          font-size: 20px;
          color: #2a2a2a;
          line-height: 1.7;
          text-align: center;
          margin: 0 0 32px;
          font-style: italic;
          position: relative;
          padding: 0 16px;
        }
        .test-quote::before {
          content: '\\201C';
          font-size: 56px;
          font-family: var(--font-family-heading);
          color: var(--color-primary, #FF4D81);
          opacity: 0.25;
          position: absolute;
          top: -28px;
          left: -4px;
          line-height: 1;
        }

        .test-author {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .test-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-family-heading);
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          flex-shrink: 0;
        }
        .test-meta {
          text-align: left;
        }
        .test-name {
          font-size: 15px;
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
        }
        .test-location {
          font-size: 13px;
          color: #999;
          line-height: 1.3;
        }

        /* dots */
        .test-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 36px;
        }
        .test-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background: #e0d8d4;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s ease, transform 0.3s ease;
        }
        .test-dot.active {
          background: var(--color-primary, #FF4D81);
          transform: scale(1.2);
        }

        @media (max-width: 600px) {
          .test-section { padding: 56px 0; }
          .test-wrapper { max-width: 100%; }
          .test-quote { font-size: 17px; padding: 0 8px; }
          .test-subtitle { margin-bottom: 36px; }
          .test-chevron { width: 36px; height: 36px; }
          .test-body { gap: 10px; }
        }
      `}</style>

      <section className="test-section" ref={sectionRef}>
        <div className="test-wrapper">
          <div className="test-header">
            <h2 className="test-title">{t('title')}</h2>
            <p className="test-subtitle">{t('subtitle')}</p>
          </div>

          <div className="test-body">
            <button className="test-chevron" onClick={goPrev} aria-label="Previous">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div className="test-showcase">
              {reviews.map((review, index) => (
                <div
                  key={review.key}
                  className={`test-card ${index === activeIndex ? 'active' : ''}`}
                >
                  <p className="test-quote">
                    {t(`reviews.${review.key}.text`)}
                  </p>
                  <div className="test-author">
                    <div
                      className="test-avatar"
                      style={{ backgroundColor: review.color }}
                    >
                      {review.initials}
                    </div>
                    <div className="test-meta">
                      <div className="test-name">{t(`reviews.${review.key}.name`)}</div>
                      <div className="test-location">{t(`reviews.${review.key}.location`)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="test-chevron" onClick={goNext} aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="test-dots">
            {reviews.map((review, index) => (
              <button
                key={review.key}
                className={`test-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => goTo(index)}
                aria-label={t(`reviews.${review.key}.name`)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
