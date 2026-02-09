/**
 * POST /api/auth/reset-password
 * 
 * Verifies OTP code, then updates the user's password.
 * Revokes all existing sessions so user must re-login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@repo/db';
import { hash } from 'bcryptjs';
import { revokeAllUserSessions } from '@/lib/auth/session';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp, 'utf8').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, password } = body as {
      email?: string;
      code?: string;
      password?: string;
    };

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const tokenHash = hashOtp(code.trim());

    // --- Find the token ---
    const token = await prisma.verificationToken.findFirst({
      where: {
        email: trimmedEmail,
        purpose: 'RESET',
        tokenHash,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (token.expiresAt <= new Date()) {
      await prisma.verificationToken.delete({ where: { id: token.id } });
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    if (token.consumedAt) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 });
    }

    if (token.attempts >= 5) {
      await prisma.verificationToken.delete({ where: { id: token.id } });
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 429 },
      );
    }

    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });

    // --- Find user ---
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Update password ---
    const passwordHash = await hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // --- Consume token ---
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    // --- Revoke all sessions (security: password changed) ---
    await revokeAllUserSessions(user.id);

    return NextResponse.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('[auth/reset-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
