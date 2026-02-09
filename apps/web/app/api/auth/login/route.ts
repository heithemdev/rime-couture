/**
 * POST /api/auth/login
 * 
 * Email + password login. Creates DB-backed session, sets httpOnly cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { compare } from 'bcryptjs';
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session';

const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // --- Find user ---
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        role: true,
        passwordHash: true,
        deletedAt: true,
        emailVerifiedAt: true,
      },
    });

    // Generic error to avoid user enumeration
    const badCreds = NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );

    if (!user || user.deletedAt) return badCreds;
    if (!user.passwordHash) return badCreds; // OAuth-only user
    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Email not verified. Please sign up again.' },
        { status: 403 },
      );
    }

    // --- Verify password ---
    const valid = await compare(password, user.passwordHash);
    if (!valid) return badCreds;

    // --- Create session ---
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;
    const { token: sessionToken } = await createSession(user.id, ip, userAgent);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('[auth/login] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
