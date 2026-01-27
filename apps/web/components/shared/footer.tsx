'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales, LOCALE_LABEL } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import styles from './footer.module.css';

export default function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();

  const collections = [
    { href: '#kids', label: t('collections.kidsDresses') },
    { href: '#kitchen', label: t('collections.kitchenTextiles') },
    { href: '#home', label: t('collections.homeDecor') },
    { href: '#new', label: t('collections.newArrivals') },
  ];

  const careTrust = [
    { href: '#process', label: t('careTrust.handmadeProcess') },
    { href: '#delivery', label: t('careTrust.deliveryInfo') },
    { href: '#care', label: t('careTrust.careGuide') },
    { href: '#contact', label: t('careTrust.contactUs') },
  ];

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  };

  return (
    <footer className={styles.root}>
      <div className={styles.container}>
        <div className={styles.mainGrid}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.brandName}>Rime Couture</span>
            </Link>
            <p className={styles.brandStory}>{t('brandStory')}</p>
            <div className={styles.socialWrapper}>
              <a href="#" aria-label="Facebook" className={styles.socialIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className={styles.socialIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="2" rx="5" ry="5" width="20" height="20" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37m1.5-4.87h.01" />
                </svg>
              </a>
              <a href="#" aria-label="Pinterest" className={styles.socialIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m8 20 4-9m-1.3 3c.437 1.263 1.43 2 2.55 2 2.071 0 3.75-1.554 3.75-4a5 5 0 1 0-9.7 1.7" />
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div className={styles.linksColumn}>
            <div className={styles.navGroups}>
              <div className={styles.navGroup}>
                <h3 className={styles.groupTitle}>{t('collectionsTitle')}</h3>
                <ul className={styles.linkList}>
                  {collections.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.navLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.navGroup}>
                <h3 className={styles.groupTitle}>{t('careTrustTitle')}</h3>
                <ul className={styles.linkList}>
                  {careTrust.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.navLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.utilityArea}>
              <div className={styles.langSwitcher}>
                <div className={styles.langLabel}>
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
                <div className={styles.langOptions}>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      className={`${styles.langBtn} ${loc === locale ? styles.active : ''}`}
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
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {currentYear} Rime Couture. {t('allRightsReserved')}
          </p>
          <div className={styles.legal}>
            <div className={styles.legalLinks}>
              <Link href="#privacy" className={styles.legalLink}>
                {t('privacyPolicy')}
              </Link>
              <Link href="#terms" className={styles.legalLink}>
                {t('termsOfService')}
              </Link>
            </div>
            <div className={styles.madeWith}>
              <span>{t('madeWithLove')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
