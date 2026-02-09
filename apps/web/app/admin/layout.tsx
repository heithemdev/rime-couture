/**
 * RIME COUTURE - Admin Layout
 * ============================
 * Server-side admin session validation for all /admin/* pages.
 * Skips auth for /admin/login (checked via x-pathname header from proxy.ts).
 *
 * Protection layers:
 * 1. proxy.ts — fast cookie-presence check, redirects if no cookie
 * 2. THIS layout — full DB session validation (expired? revoked? role?)
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { validateAdminSession } from '@/lib/auth/admin-session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Skip auth for the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Full DB validation of admin session
  // Also refreshes the sliding 2-day expiry window on each page load
  const session = await validateAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
