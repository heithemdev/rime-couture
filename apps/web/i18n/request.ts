// i18n/request.ts
// Purpose: Request-scoped next-intl config (Server Components).
// Strategy: NO locale routing; locale is stored in a cookie.
// Cost: O(n) only when cookie is missing (accept-language parsing).

import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { asLocale, defaultLocale, LOCALE_COOKIE, type Locale } from "./routing";

function pickFromAcceptLanguage(raw: string | null): Locale {
  if (!raw) return defaultLocale;

  // Example header: "fr-CA,fr;q=0.9,en;q=0.8"
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const p of parts) {
    const code = p.split(";")[0]?.trim()?.toLowerCase(); // "fr-ca"
    const base = code?.split("-")[0]; // "fr"
    const candidate = asLocale(base);
    if (candidate !== defaultLocale || base === defaultLocale) return candidate;
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;

  const locale =
    fromCookie != null
      ? asLocale(fromCookie)
      : pickFromAcceptLanguage((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
