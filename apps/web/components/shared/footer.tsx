'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales, LOCALE_LABEL } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import SafeLink from '@/components/shared/SafeLink';
import Image from 'next/image';

/* ── Real coloured social SVG icons ──────────────────────────────── */
function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="ig" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="url(#ig)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig)" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="#25F4EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="#FE2C55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" transform="translate(0.5, 0.5)" />
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" transform="translate(-0.3, -0.3)" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" fill="#1877F2" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();

  const pageLinks = [
    { href: '/', label: t('pages.home') },
    { href: '/shopping', label: t('pages.shop') },
    { href: '/orders', label: t('pages.orders') },
    { href: '/favorites', label: t('pages.favorites') },
  ];

  const aboutLinks = [
    { href: '/#hero', label: t('about.ourStory') },
    { href: '/#ordering-steps', label: t('about.howItsMade') },
    { href: '/#trust-features', label: t('about.whyMothersTrust') },
  ];

  const socials = [
    { href: '', icon: <InstagramIcon />, label: 'Instagram' },
    { href: '', icon: <TikTokIcon />, label: 'TikTok' },
    { href: '', icon: <FacebookIcon />, label: 'Facebook' },
  ];

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  };

  return (
    <>
      <style jsx>{`
        /* ── Keyframes ────────────────────────────────── */
        @keyframes footerGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes footerFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes footerShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes footerOrb {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(30px, -20px) scale(1.1); }
          66%  { transform: translate(-20px, 15px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          14%      { transform: scale(1.3); }
          28%      { transform: scale(1); }
          42%      { transform: scale(1.3); }
          56%      { transform: scale(1); }
        }
        @keyframes underlineDraw {
          from { width: 0; }
          to   { width: 32px; }
        }

        /* ── Root ─────────────────────────────────────── */
        .ft {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg,
            var(--color-surface-elevated) 0%,
            color-mix(in srgb, var(--color-surface-elevated) 92%, #FF6B9D) 50%,
            var(--color-surface-elevated) 100%
          );
          background-size: 200% 200%;
          animation: footerGradientShift 12s ease infinite;
          border-top: 2px solid transparent;
          border-image: linear-gradient(90deg, transparent, #FF6B9D, transparent) 1;
        }

        /* ── Animated orbs ────────────────────────────── */
        .ft-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
          z-index: 0;
        }
        .ft-orb--1 {
          top: -60px; right: -40px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, color-mix(in srgb, #FF6B9D 18%, transparent), transparent 70%);
          animation: footerOrb 10s ease-in-out infinite;
        }
        .ft-orb--2 {
          bottom: -40px; left: 10%;
          width: 180px; height: 180px;
          background: radial-gradient(circle, color-mix(in srgb, #FF6B9D 12%, transparent), transparent 70%);
          animation: footerOrb 14s ease-in-out infinite reverse;
        }
        .ft-orb--3 {
          top: 40%; left: 55%;
          width: 140px; height: 140px;
          background: radial-gradient(circle, color-mix(in srgb, #FFC0D0 14%, transparent), transparent 70%);
          animation: footerOrb 18s ease-in-out infinite;
        }

        /* ── Container ────────────────────────────────── */
        .ft-wrap {
          position: relative;
          z-index: 1;
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--spacing-4xl) var(--spacing-xl) var(--spacing-xl);
        }

        /* ── Top shimmer line ─────────────────────────── */
        .ft-shimmer {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #FF6B9D 50%, transparent 100%);
          background-size: 200% 100%;
          animation: footerShimmer 3s linear infinite;
        }

        /* ── Main grid ────────────────────────────────── */
        .ft-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 1fr;
          gap: var(--spacing-3xl);
          margin-bottom: var(--spacing-3xl);
        }

        /* ── Brand column ─────────────────────────────── */
        .ft-brand {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        .ft-logo {
          display: inline-block;
          text-decoration: none;
          animation: footerFloat 5s ease-in-out infinite;
        }
        .ft-story {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
          line-height: 1.8;
          max-width: 320px;
        }

        /* ── Nav columns ──────────────────────────────── */
        .ft-col-title {
          color: var(--color-on-surface);
          font-size: var(--font-size-base);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
          margin-bottom: var(--spacing-lg);
          position: relative;
          display: inline-block;
        }
        .ft-col-title::after {
          content: '';
          position: absolute;
          left: 0; bottom: -4px;
          height: 2px;
          width: 32px;
          background: #FF6B9D;
          border-radius: 2px;
          animation: underlineDraw 1.2s ease forwards;
        }
        :global([dir='rtl']) .ft-col-title::after {
          left: auto;
          right: 0;
        }

        .ft-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .ft-link {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          transition: color 0.3s ease, transform 0.3s ease;
          position: relative;
        }
        .ft-link::before {
          content: '';
          width: 0;
          height: 2px;
          background: #FF6B9D;
          border-radius: 2px;
          transition: width 0.3s ease;
          flex-shrink: 0;
        }
        .ft-link:hover {
          color: #FF6B9D;
          transform: translateX(4px);
        }
        .ft-link:hover::before {
          width: 12px;
        }
        :global([dir='rtl']) .ft-link:hover {
          transform: translateX(-4px);
        }

        /* ── Social column ────────────────────────────── */
        .ft-socials {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .ft-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .ft-social-btn:hover {
          transform: translateY(-3px) scale(1.02);
          border-color: transparent;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          color: var(--color-on-surface);
        }
        .ft-social-btn :global(svg) {
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .ft-social-btn span {
          position: relative;
          z-index: 1;
        }

        /* ── Language ─────────────────────────────────── */
        .ft-lang-area {
          border-top: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
          padding-top: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }
        .ft-lang-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-on-surface);
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-sm);
        }
        .ft-lang-label :global(svg) {
          color: #FF6B9D;
        }
        .ft-lang-pills {
          display: flex;
          gap: 4px;
          border: 1px solid var(--color-border);
          padding: 3px;
          border-radius: var(--border-radius-full);
          background: var(--color-surface);
        }
        .ft-lang-pill {
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-xs);
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-medium);
          border-radius: var(--border-radius-full);
          background: transparent;
          color: var(--color-on-surface-secondary);
          transition: all 0.3s ease;
        }
        .ft-lang-pill:hover {
          color: #FF6B9D;
        }
        .ft-lang-pill.active {
          background: #FF6B9D;
          color: #fff;
        }

        /* ── Bottom bar ───────────────────────────────── */
        .ft-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
          padding-top: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }
        .ft-copy {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
          margin: 0;
        }
        .ft-legal {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }
        .ft-legal-link {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .ft-legal-link:hover {
          color: #FF6B9D;
        }
        .ft-heart {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
        }
        .ft-heart-icon {
          color: #FF6B9D;
          display: inline-block;
          animation: heartBeat 2.5s ease infinite;
        }

        /* ── Responsive ───────────────────────────────── */
        @media (max-width: 991px) {
          .ft-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-2xl);
          }
          .ft-brand {
            grid-column: 1 / -1;
            align-items: center;
            text-align: center;
          }
          .ft-story { max-width: 100%; }
        }
        @media (max-width: 640px) {
          .ft-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .ft-brand { align-items: center; }
          .ft-col-title::after { left: 50%; transform: translateX(-50%); }
          :global([dir='rtl']) .ft-col-title::after { right: 50%; left: auto; transform: translateX(50%); }
          .ft-link { justify-content: center; }
          .ft-link:hover { transform: translateX(0); }
          .ft-link::before { display: none; }
          .ft-socials { align-items: center; }
          .ft-social-btn { justify-content: center; width: 100%; max-width: 240px; }
          .ft-lang-area { flex-direction: column; }
          .ft-bottom { flex-direction: column; text-align: center; }
          .ft-legal { flex-direction: column; gap: var(--spacing-sm); }
        }

        :global([dir='rtl']) .ft-link:hover::before { width: 12px; }
      `}</style>

      <footer className="ft">
        <div className="ft-shimmer" />
        <div className="ft-orb ft-orb--1" />
        <div className="ft-orb ft-orb--2" />
        <div className="ft-orb ft-orb--3" />

        <div className="ft-wrap">
          {/* ── Main 4-column grid ──────────────────────── */}
          <div className="ft-grid">
            {/* Brand */}
            <div className="ft-brand">
              <SafeLink href="/" newTab={false} className="ft-logo">
                <Image
                  src="/assets/Logo.webp"
                  alt="Rimoucha"
                  width={140}
                  height={56}
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                />
              </SafeLink>
              <p className="ft-story">{t('brandStory')}</p>
            </div>

            {/* Pages */}
            <div>
              <h3 className="ft-col-title">{t('pagesTitle')}</h3>
              <ul className="ft-links">
                {pageLinks.map((l) => (
                  <li key={l.href}>
                    <SafeLink href={l.href} newTab={false} className="ft-link">
                      {l.label}
                    </SafeLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="ft-col-title">{t('aboutTitle')}</h3>
              <ul className="ft-links">
                {aboutLinks.map((l) => (
                  <li key={l.href}>
                    <SafeLink href={l.href} newTab={false} className="ft-link">
                      {l.label}
                    </SafeLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="ft-col-title">{t('followUs')}</h3>
              <div className="ft-socials">
                {socials.map((s) => (
                  <SafeLink
                    key={s.label}
                    href={s.href || '#'}
                    newTab={!!s.href}
                    className="ft-social-btn"
                    aria-label={s.label}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </SafeLink>
                ))}
              </div>
            </div>
          </div>

          {/* ── Language switcher ───────────────────────── */}
          <div className="ft-lang-area">
            <div className="ft-lang-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10M2 12h20" />
              </svg>
              <span>{tc('language')}</span>
            </div>
            <div className="ft-lang-pills">
              {locales.map((loc) => (
                <button
                  key={loc}
                  className={`ft-lang-pill ${loc === locale ? 'active' : ''}`}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending}
                >
                  {LOCALE_LABEL[loc]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bottom bar ──────────────────────────────── */}
          <div className="ft-bottom">
            <p className="ft-copy">
              © {currentYear} Rimoucha. {t('allRightsReserved')}
            </p>
            <div className="ft-legal">
              <SafeLink href="#privacy" newTab={false} className="ft-legal-link">
                {t('privacyPolicy')}
              </SafeLink>
              <SafeLink href="#terms" newTab={false} className="ft-legal-link">
                {t('termsOfService')}
              </SafeLink>
              <span className="ft-heart">
                {t('madeWithLove', { heart: '' })} <span className="ft-heart-icon">♥</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
