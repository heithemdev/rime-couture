// app/api/auth/sign-up/start/route.ts
// Sign-up Step 1: Generate OTP and send verification email

import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, checkRateLimit } from "@/lib/secured/secure-api";
import { sendOtp } from "@/lib/email/basic";

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;

// Rate limit: 3 attempts per 15 minutes per email
const SIGNUP_START_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
};

interface SignUpStartBody {
  email: string;
  name: string;
  phone?: string;
  password: string;
}

function validateBody(body: unknown): body is SignUpStartBody {
  if (!body || typeof body !== "object") return false;
  const { email, name, password, phone } = body as Record<string, unknown>;
  
  if (typeof email !== "string" || !email.includes("@") || email.length < 5) return false;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) return false;
  if (typeof password !== "string" || password.length < 8) return false;
  if (phone !== undefined && phone !== null && phone !== "" && 
      (typeof phone !== "string" || phone.length < 9 || phone.length > 15)) return false;
  
  return true;
}

function generateOtp(): string {
  const bytes = randomBytes(4);
  const num = bytes.readUInt32BE(0);
  const max = Math.pow(10, OTP_LENGTH);
  return (num % max).toString().padStart(OTP_LENGTH, "0");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // CSRF check
    if (!csrfOk(request)) {
      return noCacheJson({ error: "CSRF validation failed" }, 403);
    }

    // Parse request body
    const bodyResult = await readJson(request);
    if (!bodyResult.ok) {
      return noCacheJson({ error: "Invalid request body" }, bodyResult.status);
    }

    const body = bodyResult.data;
    if (!validateBody(body)) {
      return noCacheJson({ 
        error: "Please provide a valid email, name (2-100 chars), and password (min 8 chars)" 
      }, 400);
    }

    const { email, name, phone, password } = body;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();

    // Rate limiting by email
    const rateLimitKey = `signup:${normalizedEmail}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      SIGNUP_START_RATE_LIMIT.maxAttempts,
      SIGNUP_START_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      return noCacheJson(
        { 
          error: "Too many verification attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        },
        429
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return noCacheJson({ error: "An account with this email already exists" }, 409);
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // Hash password for storage
    const passwordHash = hashPassword(password);

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email: normalizedEmail, purpose: "SIGNUP" },
    });

    // Store all data in the tokenHash field as JSON (workaround for limited schema)
    // The tokenHash will contain: otpHash|passwordHash|name|phone
    const dataPayload = JSON.stringify({
      otpHash,
      passwordHash,
      name: normalizedName,
      phone: phone || null,
    });

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        purpose: "SIGNUP",
        tokenHash: dataPayload,
        expiresAt: otpExpires,
      },
    });

    // Send OTP email
    try {
      await sendOtp(normalizedEmail, otp, "SIGNUP");
    } catch (emailError) {
      console.error("[auth/sign-up/start] Failed to send email:", emailError);
      await prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail, purpose: "SIGNUP" },
      });
      return noCacheJson({ error: "Failed to send verification email. Please try again." }, 500);
    }

    console.log(`[auth] Sign-up OTP sent to ${normalizedEmail}`);

    return noCacheJson({
      success: true,
      message: "Verification code sent to your email",
      email: normalizedEmail,
      expiresIn: OTP_EXPIRES_MINUTES * 60,
    });
  } catch (error) {
    console.error("[auth/sign-up/start] Error:", error);
    return noCacheJson({ error: "An error occurred. Please try again." }, 500);
  }
}
