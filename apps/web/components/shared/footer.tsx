'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales, LOCALE_LABEL } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import SafeLink from '@/components/shared/SafeLink';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();

  const shopLinks = [
    { href: '#new', label: t('shop.newArrivals') },
    { href: '#bestsellers', label: t('shop.bestSellers') },
    { href: '#dresses', label: t('shop.kidsDresses') },
    { href: '#home', label: t('shop.homeTextiles') },
  ];

  const aboutLinks = [
    { href: '#story', label: t('about.ourStory') },
    { href: '#process', label: t('about.howItsMade') },
    { href: '#faq', label: t('about.faq') },
    { href: '#contact', label: t('about.contactUs') },
  ];

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  };

  return (
    <>
      <style jsx>{`
        .footer-root {
          overflow: hidden;
          position: relative;
          border-top: var(--divider-value);
          padding-top: var(--spacing-4xl);
          padding-bottom: var(--spacing-xl);
          background-color: var(--color-surface-elevated);
          font-family: var(--font-work-sans), 'Work Sans', sans-serif;
        }
        .footer-root::before {
          top: -10%;
          right: -5%;
          width: 300px;
          height: 300px;
          content: '';
          z-index: 0;
          position: absolute;
          background: radial-gradient(
            circle,
            color-mix(in srgb, #FF6B9D 10%, transparent) 0%,
            transparent 70%
          );
          border-radius: var(--border-radius-full);
        }
        .footer-container {
          margin: 0 auto;
          padding: 0 var(--spacing-xl);
          z-index: 1;
          position: relative;
          max-width: var(--content-max-width);
        }
        .footer-main-grid {
          gap: var(--spacing-4xl);
          display: flex;
          margin-bottom: var(--spacing-4xl);
        }
        .footer-brand-column {
          gap: var(--spacing-xl);
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .footer-links-column {
          gap: var(--spacing-3xl);
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .footer-logo-link {
          display: inline-block;
          text-decoration: none;
        }
        .footer-brand-name {
          color: #FF6B9D;
          font-size: 1.75rem;
          font-family: 'Pacifico', 'Dancing Script', 'Satisfy', cursive, var(--font-family-heading);
          font-weight: 400;
          letter-spacing: 1px;
        }
        .footer-brand-story {
          color: var(--color-on-surface-secondary);
          max-width: 400px;
          line-height: 1.8;
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
        }
        .footer-social-wrapper {
          gap: var(--spacing-md);
          display: flex;
        }
        .footer-social-icon {
          color: #FF6B9D;
          width: 44px;
          border: 2px solid #FF6B9D;
          height: 44px;
          display: flex;
          background: transparent;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          align-items: center;
          border-radius: var(--border-radius-full);
          justify-content: center;
        }
        .footer-social-icon:hover {
          color: var(--color-surface);
          transform: translateY(-5px) rotate(8deg);
          background: #FF6B9D;
          box-shadow: 0 10px 20px color-mix(in srgb, #FF6B9D 30%, transparent);
        }
        .footer-social-icon :global(svg) {
          width: 20px;
          height: 20px;
          stroke-width: 2.5;
        }
        .footer-nav-groups {
          gap: var(--spacing-4xl);
          display: flex;
        }
        .footer-nav-group {
          flex: 1;
        }
        .footer-group-title {
          color: var(--color-on-surface);
          display: inline-block;
          position: relative;
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-xl);
          font-family: var(--font-family-heading);
          font-weight: var(--font-weight-heading);
        }
        .footer-group-title::after {
          left: 0;
          width: 30px;
          bottom: -4px;
          height: 2px;
          content: '';
          position: absolute;
          background: #FF6B9D;
          border-radius: var(--border-radius-full);
        }
        .footer-link-list {
          gap: var(--spacing-md);
          margin: 0;
          display: flex;
          padding: 0;
          list-style: none;
          flex-direction: column;
        }
        .footer-nav-link {
          color: var(--color-on-surface-secondary);
          display: inline-block;
          font-size: var(--font-size-base);
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .footer-nav-link:hover {
          color: #FF6B9D;
          transform: translateX(5px);
        }
        .footer-utility-area {
          border-top: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
          padding-top: var(--spacing-xl);
        }
        .footer-lang-switcher {
          gap: var(--spacing-xl);
          display: flex;
          align-items: center;
        }
        .footer-lang-label {
          gap: var(--spacing-sm);
          color: var(--color-on-surface);
          display: flex;
          align-items: center;
          font-weight: var(--font-weight-medium);
        }
        .footer-lang-label :global(svg) {
          color: #FF6B9D;
        }
        .footer-lang-options {
          gap: var(--spacing-xs);
          border: 1px solid var(--color-border);
          display: flex;
          padding: 4px;
          background: var(--color-surface);
          border-radius: var(--border-radius-full);
        }
        .footer-lang-btn {
          color: var(--color-on-surface-secondary);
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-xs);
          background: transparent;
          transition: all 0.3s ease;
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-medium);
          border-radius: var(--border-radius-full);
        }
        .footer-lang-btn:hover {
          color: #FF6B9D;
        }
        .footer-lang-btn.active {
          color: var(--color-on-primary);
          background: #FF6B9D;
        }
        .footer-bottom-bar {
          gap: var(--spacing-xl);
          display: flex;
          border-top: 1px solid var(--color-border);
          align-items: center;
          padding-top: var(--spacing-xl);
          justify-content: space-between;
        }
        .footer-copyright {
          color: var(--color-on-surface-secondary);
          margin: 0;
          font-size: var(--font-size-sm);
        }
        .footer-legal {
          gap: var(--spacing-2xl);
          display: flex;
          align-items: center;
        }
        .footer-legal-links {
          gap: var(--spacing-lg);
          display: flex;
        }
        .footer-legal-link {
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-xs);
          transition: color 0.3s ease;
          text-decoration: none;
        }
        .footer-legal-link:hover {
          color: #FF6B9D;
        }
        .footer-made-with {
          gap: var(--spacing-xs);
          color: var(--color-on-surface-secondary);
          display: flex;
          align-items: center;
          font-size: var(--font-size-xs);
        }
        .footer-heart {
          color: #FF6B9D;
        }
        @media (max-width: 991px) {
          .footer-main-grid {
            gap: var(--spacing-3xl);
            flex-direction: column;
          }
          .footer-brand-column {
            text-align: center;
            align-items: center;
          }
          .footer-links-column {
            align-items: center;
          }
          .footer-brand-story {
            max-width: 100%;
          }
          .footer-nav-groups {
            width: 100%;
            justify-content: space-around;
          }
          .footer-nav-group {
            text-align: center;
          }
        }
        @media (max-width: 767px) {
          .footer-bottom-bar {
            text-align: center;
            flex-direction: column;
          }
          .footer-legal {
            gap: var(--spacing-md);
            flex-direction: column;
          }
          .footer-nav-groups {
            gap: var(--spacing-2xl);
            flex-direction: column;
          }
        }
        @media (max-width: 479px) {
          .footer-root {
            padding-top: var(--spacing-3xl);
          }
          .footer-lang-options {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
        :global([dir='rtl']) .footer-root {
          text-align: right;
        }
        :global([dir='rtl']) .footer-nav-link:hover {
          transform: translateX(-5px);
        }
        :global([dir='rtl']) .footer-group-title::after {
          left: auto;
          right: 0;
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-container">
          <div className="footer-main-grid">
            {/* Brand Column */}
            <div className="footer-brand-column">
              <SafeLink href="/" newTab={false} className="footer-logo-link">
                <Image src="/assets/Logo.webp" alt="Rimoucha" width={140} height={56} className="footer-brand-logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </SafeLink>
              <p className="footer-brand-story">{t('brandStory')}</p>
              <div className="footer-social-wrapper">
                <SafeLink
                  href="https://facebook.com"
                  newTab={true}
                  aria-label="Facebook"
                  className="footer-social-icon"
                >
                  <Facebook />
                </SafeLink>
                <SafeLink
                  href="https://instagram.com"
                  newTab={true}
                  aria-label="Instagram"
                  className="footer-social-icon"
                >
                  <Instagram />
                </SafeLink>
                <SafeLink
                  href="https://twitter.com"
                  newTab={true}
                  aria-label="Twitter"
                  className="footer-social-icon"
                >
                  <Twitter />
                </SafeLink>
              </div>
            </div>

            {/* Links Column */}
            <div className="footer-links-column">
              <div className="footer-nav-groups">
                <div className="footer-nav-group">
                  <h3 className="footer-group-title">{t('shopTitle')}</h3>
                  <ul className="footer-link-list">
                    {shopLinks.map((item) => (
                      <li key={item.href}>
                        <SafeLink href={item.href} newTab={false} className="footer-nav-link">
                          {item.label}
                        </SafeLink>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="footer-nav-group">
                  <h3 className="footer-group-title">{t('aboutTitle')}</h3>
                  <ul className="footer-link-list">
                    {aboutLinks.map((item) => (
                      <li key={item.href}>
                        <SafeLink href={item.href} newTab={false} className="footer-nav-link">
                          {item.label}
                        </SafeLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="footer-utility-area">
                <div className="footer-lang-switcher">
                  <div className="footer-lang-label">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10M2 12h20" />
                    </svg>
                    <span>{tc('language')}</span>
                  </div>
                  <div className="footer-lang-options">
                    {locales.map((loc) => (
                      <button
                        key={loc}
                        className={`footer-lang-btn ${loc === locale ? 'active' : ''}`}
                        onClick={() => handleLocaleChange(loc)}
                        disabled={isPending}
                      >
                        {LOCALE_LABEL[loc]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom-bar">
            <p className="footer-copyright">
              © {currentYear} Rimoucha. {t('allRightsReserved')}
            </p>
            <div className="footer-legal">
              <div className="footer-legal-links">
                <SafeLink href="#privacy" newTab={false} className="footer-legal-link">
                  {t('privacyPolicy')}
                </SafeLink>
                <SafeLink href="#terms" newTab={false} className="footer-legal-link">
                  {t('termsOfService')}
                </SafeLink>
              </div>
              <div className="footer-made-with">
                {t('madeWithLove', { heart: '♥' })}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
