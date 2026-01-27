'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales, LOCALE_LABEL } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import styles from './header.module.css';

export default function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#shop', label: t('shop') },
    { href: '#kids', label: t('kidsDresses') },
    { href: '#home', label: t('homeTextiles') },
    { href: '#story', label: t('ourStory') },
    { href: '#contact', label: t('contact') },
  ];

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  };

  return (
    <>
      <nav className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.main}>
            {/* Left: Toggle + Links */}
            <div className={styles.left}>
              <button
                className={styles.toggle}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={tc('openMenu')}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12h16M4 6h16M4 18h16" />
                </svg>
              </button>
              <ul className={styles.desktopLinks}>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Center: Brand */}
            <Link href="/" className={styles.brand}>
              Rime Couture
            </Link>

            {/* Right: Lang + Cart */}
            <div className={styles.right}>
              <div className={styles.langSwitcher}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10M2 12h20" />
                </svg>
                <span style={{ opacity: isPending ? 0.5 : 1 }}>{LOCALE_LABEL[locale]}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <div className={styles.langDropdown}>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      className={`${styles.langOption} ${loc === locale ? styles.active : ''}`}
                      onClick={() => handleLocaleChange(loc)}
                      disabled={isPending}
                    >
                      {LOCALE_LABEL[loc]}
                    </button>
                  ))}
                </div>
              </div>
              <Link href="#cart" className={styles.cartBtn} aria-label={tc('shoppingCart')}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span className={styles.cartBadge}>0</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <div className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.active : ''}`}>
        <div className={styles.mobileHeader}>
          <span className={styles.mobileHeaderBrand}>Rime Couture</span>
          <button
            className={styles.closeBtn}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={tc('closeMenu')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.mobileContent}>
          <ul className={styles.mobileList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.mobileFooter}>
            <div className={styles.mobileLang}>
              {locales.map((loc) => (
                <button
                  key={loc}
                  className={`btn btn-sm ${loc === locale ? 'btn-primary' : 'btn-outline'}`}
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
    </>
  );
}
