// apps/web/components/shared/Sanitized.tsx
import { createElement, type HTMLAttributes } from 'react';
import { sanitizeHTML } from '@/lib/secured/secure-ui';

// Safe tag union (expandable as needed)
type TagName =
  | 'div'
  | 'section'
  | 'article'
  | 'main'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'span'
  | 'p'
  | 'li';

type Props = Omit<HTMLAttributes<HTMLElement>, 'dangerouslySetInnerHTML'> & {
  /** Raw HTML string to sanitize */
  html: string;
  /** Allow iframe tags (for embeds like YouTube, maps) */
  allowIframes?: boolean;
  /** Extra URL schemes to allow (e.g., 'whatsapp:', 'viber:') */
  extraSchemes?: string[];
  /** HTML tag to render (default: 'div') */
  as?: TagName;
};

/**
 * Server Component that safely renders sanitized HTML.
 * Uses DOMPurify on server, escapes HTML as fallback.
 *
 * @example
 * <Sanitized html={product.description} className="prose" />
 * <Sanitized html={richText} as="article" allowIframes />
 */
export default async function Sanitized({
  html,
  allowIframes = false,
  extraSchemes,
  as = 'div',
  ...rest
}: Props) {
  const clean = await sanitizeHTML(html, {
    allowIframes,
    extraAllowedSchemes: extraSchemes,
  });

  return createElement(as, {
    ...rest,
    dangerouslySetInnerHTML: { __html: clean },
  });
}
