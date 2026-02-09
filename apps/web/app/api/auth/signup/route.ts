/**
 * POST /api/auth/signup
 * 
 * Step 1 of signup: validate inputs, check email not taken,
 * generate 5-digit OTP, hash it, store in VerificationToken, send email.
 * 
 * Does NOT create the user yet — that happens after OTP verification.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomInt } from 'node:crypto';
import { prisma } from '@repo/db';
import { sendOtpEmail } from '@/lib/email';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp, 'utf8').digest('hex');
}

// Validate Algerian phone: must start with 05, 06 or 07, exactly 10 digits
function isValidPhone(phone: string): boolean {
  return /^0[567]\d{8}$/.test(phone);
}

// Name: letters, spaces, underscores only (Arabic + Latin)
function isValidName(name: string): boolean {
  return /^[\p{L}\s_]{2,60}$/u.test(name);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    // --- Validation ---
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!isValidName(trimmedName)) {
      return NextResponse.json(
        { error: 'Name can only contain letters, spaces, and underscores' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!isValidPhone(trimmedPhone)) {
      return NextResponse.json(
        { error: 'Phone must start with 05, 06, or 07 and be exactly 10 digits' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // --- Check if email is already taken ---
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // --- Generate OTP ---
    const otp = String(randomInt(10000, 99999)); // 5 digits, never starts with 0
    const tokenHash = hashOtp(otp);

    // --- Delete any existing tokens for this email + purpose ---
    await prisma.verificationToken.deleteMany({
      where: { email: trimmedEmail, purpose: 'SIGNUP' },
    });

    // --- Store hashed OTP ---
    await prisma.verificationToken.create({
      data: {
        email: trimmedEmail,
        purpose: 'SIGNUP',
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // --- Send email ---
    await sendOtpEmail(trimmedEmail, otp, 'SIGNUP');

    return NextResponse.json({ ok: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('[auth/signup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
