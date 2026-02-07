// apps/web/components/shared/SafeLink.tsx
'use client';

import { forwardRef, type AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { safeHref, safeRedirectTarget, externalRel } from '@/lib/secured/secure-ui';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** The link destination */
  href: string;
  /** Allow only these hosts for external URLs (security) */
  allowedHosts?: string[];
  /** Base URL for resolving relative hrefs */
  base?: string;
  /** Open external links in a new tab (default: true for external) */
  newTab?: boolean;
  /** Extra rel tokens (e.g., "nofollow sponsored") */
  relExtra?: string;
};

/**
 * A secure anchor that sanitizes URLs and adds proper rel attributes.
 * - Internal links (/path, #anchor, ?query) pass through unchanged
 * - External links get noopener/noreferrer automatically
 * - Dangerous protocols (javascript:, data:) are blocked
 *
 * @example
 * <SafeLink href="/products">Products</SafeLink>
 * <SafeLink href="https://example.com" newTab>External</SafeLink>
 * <SafeLink href={userUrl} allowedHosts={['trusted.com']}>User Link</SafeLink>
 */
const SafeLink = forwardRef<HTMLAnchorElement, Props>(function SafeLink(
  { href, allowedHosts, base, newTab = true, relExtra, children, ...rest },
  ref,
) {
  // Internal/relative links: pass through as-is (fast path)
  const isInternal = href.startsWith('/') || href.startsWith('#') || href.startsWith('?');

  if (isInternal) {
    return (
      <Link ref={ref} href={href} {...rest}>
        {children}
      </Link>
    );
  }

  // External links: sanitize and harden
  const normalized = safeHref(href, base);
  const finalHref = allowedHosts?.length
    ? safeRedirectTarget(normalized, allowedHosts, '#')
    : normalized;

  const target = newTab ? '_blank' : undefined;
  const rel = externalRel(target, relExtra);

  return (
    <a ref={ref} href={finalHref} target={target} rel={rel} {...rest}>
      {children}
    </a>
  );
});

export default SafeLink;
