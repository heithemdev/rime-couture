/**
 * GET /api/auth/me
 * 
 * Returns the current user if a valid session exists.
 * Checks client session first, then falls back to admin session.
 * Used by the frontend to check login state.
 */
import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session';
import { validateAdminSession } from '@/lib/auth/admin-session';

export async function GET() {
  try {
    // 1. Check client session
    const session = await validateSession();

    if (session) {
      return NextResponse.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          role: session.user.role,
          phone: session.user.phone,
          avatarUrl: session.user.avatarUrl,
          isAdminSession: false,
        },
      });
    }

    // 2. Fall back to admin session
    const adminSession = await validateAdminSession();

    if (adminSession) {
      return NextResponse.json({
        user: {
          id: adminSession.admin.id,
          email: adminSession.admin.email,
          displayName: adminSession.admin.displayName || 'Fatiha',
          role: 'ADMIN',
          phone: null,
          isAdminSession: true,
        },
      });
    }

    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ user: null });
  }
}
