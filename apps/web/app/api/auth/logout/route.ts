/**
 * POST /api/auth/logout
 * 
 * Revokes the current session and clears the cookie.
 */
import { NextResponse } from 'next/server';
import { revokeCurrentSession } from '@/lib/auth/session';

const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST() {
  try {
    await revokeCurrentSession();

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[auth/logout] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
