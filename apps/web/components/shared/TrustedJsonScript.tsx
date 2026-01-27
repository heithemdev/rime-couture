// apps/web/components/shared/TrustedJsonScript.tsx
import { safeJson } from '@/lib/secured/secure-ui';

type Props = {
  /** The data to serialize as JSON-LD or other structured data */
  data: Record<string, unknown>;
  /** Script type (default: application/ld+json for structured data) */
  type?: string;
  /** Optional id for the script tag */
  id?: string;
};

/**
 * Safely renders a JSON script tag (e.g., for JSON-LD structured data).
 * Prevents XSS by escaping dangerous characters in the JSON output.
 * 
 * @example
 * <TrustedJsonScript 
 *   id="product-schema"
 *   data={{
 *     "@context": "https://schema.org",
 *     "@type": "Product",
 *     "name": "Kids Dress",
 *   }} 
 * />
 */
export default function TrustedJsonScript({ data, type = 'application/ld+json', id }: Props) {
  return (
    <script
      id={id}
      type={type}
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  );
}
