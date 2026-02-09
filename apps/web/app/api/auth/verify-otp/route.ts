/**
 * POST /api/auth/verify-otp
 * 
 * Step 2 of signup: verify OTP, create the user, create a session.
 * Returns session cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@repo/db';
import { hash } from 'bcryptjs';
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp, 'utf8').digest('hex');
}

const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, name, phone, password } = body as {
      email?: string;
      code?: string;
      name?: string;
      phone?: string;
      password?: string;
    };

    if (!email || !code || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // --- Find the verification token ---
    const tokenHash = hashOtp(trimmedCode);

    const token = await prisma.verificationToken.findFirst({
      where: {
        email: trimmedEmail,
        purpose: 'SIGNUP',
        tokenHash,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // --- Check expiry ---
    if (token.expiresAt <= new Date()) {
      await prisma.verificationToken.delete({ where: { id: token.id } });
      return NextResponse.json({ error: 'Code has expired. Please sign up again.' }, { status: 400 });
    }

    // --- Check consumed ---
    if (token.consumedAt) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 });
    }

    // --- Increment attempt counter (max 5 attempts) ---
    if (token.attempts >= 5) {
      await prisma.verificationToken.delete({ where: { id: token.id } });
      return NextResponse.json(
        { error: 'Too many attempts. Please sign up again.' },
        { status: 429 },
      );
    }

    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });

    // --- Double-check email not already registered (race condition guard) ---
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // --- Hash password ---
    const passwordHash = await hash(password, 12);

    // --- Create user with role CLIENT ---
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        displayName: name.trim(),
        phone: phone?.trim() || null,
        passwordHash,
        role: 'CLIENT',
        emailVerifiedAt: new Date(),
      },
    });

    // --- Consume the token ---
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    // --- Create session ---
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;
    const { token: sessionToken } = await createSession(user.id, ip, userAgent);

    // --- Set cookie ---
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
    console.error('[auth/verify-otp] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
