/**
 * POST /api/auth/forgot-password
 * 
 * Checks if email exists. If yes, sends 5-digit OTP.
 * If not, returns an error telling user the email doesn't exist.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomInt } from 'node:crypto';
import { prisma } from '@repo/db';
import { sendOtpEmail } from '@/lib/email';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp, 'utf8').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // --- Check if email exists ---
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 },
      );
    }

    // --- Generate OTP ---
    const otp = String(randomInt(10000, 99999));
    const tokenHash = hashOtp(otp);

    // --- Clean old RESET tokens for this email ---
    await prisma.verificationToken.deleteMany({
      where: { email: trimmedEmail, purpose: 'RESET' },
    });

    // --- Store hashed OTP ---
    await prisma.verificationToken.create({
      data: {
        email: trimmedEmail,
        purpose: 'RESET',
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    // --- Send email ---
    await sendOtpEmail(trimmedEmail, otp, 'RESET');

    return NextResponse.json({ ok: true, message: 'Reset code sent' });
  } catch (error) {
    console.error('[auth/forgot-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
