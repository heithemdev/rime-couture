'use client';

import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import SafeLink from '@/components/shared/SafeLink';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to translation key mapping
const ROUTE_TRANSLATIONS: Record<string, string> = {
  '/': 'home',
  '/shopping': 'shop',
  '/products': 'shop',
  '/kids-dresses': 'kidsDresses',
  '/home-textiles': 'homeTextiles',
  '/about': 'about',
  '/contact': 'contact',
};

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('shopping.breadcrumb');
  const tNav = useTranslations('nav');

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: t('home'), href: '/' }];

    let currentPath = '';
    for (const segment of segments) {
      // Skip locale segment
      if (['en', 'fr', 'ar'].includes(segment)) continue;
      
      currentPath += `/${segment}`;
      const translationKey = ROUTE_TRANSLATIONS[currentPath];
      const label = translationKey 
        ? (t.has(translationKey) ? t(translationKey) : tNav.has(translationKey) ? tNav(translationKey) : segment)
        : segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      crumbs.push({ label, href: `/${locale}${currentPath}` });
    }

    // Last item should not have href (current page)
    if (crumbs.length > 1) {
      const lastCrumb = crumbs[crumbs.length - 1];
      if (lastCrumb) {
        lastCrumb.href = undefined;
      }
    }

    return crumbs;
  })();

  if (breadcrumbs.length <= 1) return null;

  return (
    <>
      <style jsx>{`
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          padding: var(--spacing-md) 0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .breadcrumb-nav::-webkit-scrollbar {
          display: none;
        }
        .breadcrumb-list {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          list-style: none;
          margin: 0;
          padding: 0;
          flex-wrap: nowrap;
        }
        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          white-space: nowrap;
        }
        .breadcrumb-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-on-surface-secondary);
          font-size: var(--font-size-sm);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-sm);
        }
        .breadcrumb-link:hover {
          color: var(--color-primary);
          background: rgba(255, 77, 129, 0.08);
        }
        .breadcrumb-link.current {
          color: var(--color-on-surface);
          font-weight: 600;
          pointer-events: none;
        }
        .breadcrumb-separator {
          color: var(--color-border);
          flex-shrink: 0;
        }
        .breadcrumb-home-icon {
          width: 16px;
          height: 16px;
        }
        @media (max-width: 767px) {
          .breadcrumb-link {
            font-size: var(--font-size-xs);
            padding: var(--spacing-xs);
          }
        }
      `}</style>

      <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isFirst = index === 0;

            return (
              <li key={index} className="breadcrumb-item">
                {index > 0 && (
                  <ChevronRight className="breadcrumb-separator" size={14} />
                )}
                {item.href && !isLast ? (
                  <SafeLink href={item.href} className="breadcrumb-link">
                    {isFirst && <Home className="breadcrumb-home-icon" />}
                    <span>{item.label}</span>
                  </SafeLink>
                ) : (
                  <span className="breadcrumb-link current">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
