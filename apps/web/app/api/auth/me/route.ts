/**
 * GET /api/auth/me
 * 
 * Returns the current user if a valid session exists.
 * Used by the frontend to check login state.
 */
import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await validateSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.user.role,
        phone: session.user.phone,
      },
    });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ user: null });
  }
}
