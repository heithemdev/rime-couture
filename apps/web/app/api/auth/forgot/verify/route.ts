// app/api/auth/forgot/verify/route.ts
// Forgot Password Step 2: Verify OTP code

import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, checkRateLimit } from "@/lib/secured/secure-api";

// Rate limit: 5 attempts per 15 minutes per email
const VERIFY_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

// How long the reset token is valid
const RESET_TOKEN_EXPIRES_MINUTES = 5;

interface ForgotVerifyBody {
  email: string;
  code: string;
}

function validateBody(body: unknown): body is ForgotVerifyBody {
  if (!body || typeof body !== "object") return false;
  const { email, code } = body as Record<string, unknown>;
  return (
    typeof email === "string" &&
    email.includes("@") &&
    email.length >= 5 &&
    typeof code === "string" &&
    code.length === 6 &&
    /^\d{6}$/.test(code)
  );
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
      return noCacheJson({ error: "Please provide a valid email and 6-digit code" }, 400);
    }

    const { email, code } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    const rateLimitKey = `forgot-verify:${normalizedEmail}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      VERIFY_RATE_LIMIT.maxAttempts,
      VERIFY_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      return noCacheJson(
        { 
          error: "Too many verification attempts. Please request a new code.",
          retryAfter: rateLimitResult.retryAfter 
        },
        429
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "RESET",
      },
    });

    if (!verificationToken) {
      return noCacheJson({ error: "No reset request found for this email" }, 400);
    }

    // Check if expired
    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return noCacheJson({ error: "Verification code has expired. Please request a new one." }, 400);
    }

    // Increment attempts
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { attempts: { increment: 1 } },
    });

    // Too many attempts
    if (verificationToken.attempts >= 5) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return noCacheJson({ error: "Too many failed attempts. Please request a new code." }, 400);
    }

    // Verify OTP
    const providedHash = hashToken(code);
    if (providedHash !== verificationToken.tokenHash) {
      return noCacheJson({ error: "Invalid verification code" }, 400);
    }

    // Delete the OTP token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Generate a reset token for the next step
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(resetToken);
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    // Create verified reset token
    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        purpose: "RESET_VERIFIED",
        tokenHash: resetTokenHash,
        expiresAt: resetExpires,
      },
    });

    console.log(`[auth] Password reset code verified for ${normalizedEmail}`);

    return noCacheJson({
      success: true,
      message: "Code verified successfully. You can now set a new password.",
      email: normalizedEmail,
      resetToken: resetToken,
      expiresIn: RESET_TOKEN_EXPIRES_MINUTES * 60,
    });
  } catch (error) {
    console.error("[auth/forgot/verify] Error:", error);
    return noCacheJson({ error: "An error occurred. Please try again." }, 500);
  }
}
