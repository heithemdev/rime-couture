// i18n/actions.ts
'use server';

// Purpose: Change locale without changing URL structure.
// Safety: validates locale + writes a long-lived cookie.

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, asLocale, type Locale } from './routing';

export async function setUserLocale(next: Locale) {
  const locale = asLocale(next);

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
