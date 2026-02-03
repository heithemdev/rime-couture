// app/api/auth/forgot/start/route.ts
// Forgot Password Step 1: Generate OTP and send reset email

import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, checkRateLimit } from "@/lib/secured/secure-api";
import { sendOtp } from "@/lib/email/basic";

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;

// Rate limit: 3 attempts per 15 minutes per email
const FORGOT_START_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
};

interface ForgotStartBody {
  email: string;
}

function validateBody(body: unknown): body is ForgotStartBody {
  if (!body || typeof body !== "object") return false;
  const { email } = body as Record<string, unknown>;
  return typeof email === "string" && email.includes("@") && email.length >= 5;
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
      return noCacheJson({ error: "Please provide a valid email address" }, 400);
    }

    const { email } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting by email
    const rateLimitKey = `forgot:${normalizedEmail}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      FORGOT_START_RATE_LIMIT.maxAttempts,
      FORGOT_START_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      return noCacheJson(
        { 
          error: "Too many reset attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        },
        429
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: "If an account exists with this email, you will receive a reset code.",
      email: normalizedEmail,
      expiresIn: OTP_EXPIRES_MINUTES * 60,
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      console.log(`[auth] Forgot password attempt for non-existent email: ${normalizedEmail}`);
      return noCacheJson(successResponse);
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email: normalizedEmail, purpose: "RESET" },
    });

    // Create reset token
    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        purpose: "RESET",
        tokenHash: otpHash,
        expiresAt: otpExpires,
      },
    });

    // Send OTP email
    try {
      await sendOtp(normalizedEmail, otp, "RESET");
    } catch (emailError) {
      console.error("[auth/forgot/start] Failed to send email:", emailError);
      await prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail, purpose: "RESET" },
      });
      return noCacheJson({ error: "Failed to send reset email. Please try again." }, 500);
    }

    console.log(`[auth] Password reset OTP sent to ${normalizedEmail}`);

    return noCacheJson(successResponse);
  } catch (error) {
    console.error("[auth/forgot/start] Error:", error);
    return noCacheJson({ error: "An error occurred. Please try again." }, 500);
  }
}
