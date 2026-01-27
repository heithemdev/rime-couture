// i18n/routing.ts
// Purpose: Single source of truth for locales + RTL handling.
// Perf: O(1) checks, tiny helpers.

import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Cookie used for "no-locale-in-URL" strategy (keeps your routes unchanged).
export const LOCALE_COOKIE = "locale";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "never", // No locale prefix in URLs - cookie-based only
});

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  ar: "AR",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

export function asLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}
