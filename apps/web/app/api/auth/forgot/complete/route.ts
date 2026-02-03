// app/api/auth/forgot/complete/route.ts
// Forgot Password Step 3: Set new password

import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, checkRateLimit } from "@/lib/secured/secure-api";
import { createSession } from "@/lib/auth/session";
import { sendPasswordChangedEmail } from "@/lib/email/basic";
import { cookies } from "next/headers";

// Rate limit: 3 attempts per 15 minutes per email
const RESET_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
};

interface ForgotCompleteBody {
  email: string;
  resetToken: string;
  password: string;
}

function validateBody(body: unknown): body is ForgotCompleteBody {
  if (!body || typeof body !== "object") return false;
  const { email, resetToken, password } = body as Record<string, unknown>;
  return (
    typeof email === "string" &&
    email.includes("@") &&
    email.length >= 5 &&
    typeof resetToken === "string" &&
    resetToken.length === 64 && // 32 bytes = 64 hex chars
    typeof password === "string" &&
    password.length >= 8
  );
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
        error: "Please provide a valid email, reset token, and password (min 8 characters)" 
      }, 400);
    }

    const { email, resetToken, password } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    const rateLimitKey = `forgot-complete:${normalizedEmail}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      RESET_RATE_LIMIT.maxAttempts,
      RESET_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      return noCacheJson(
        { 
          error: "Too many reset attempts. Please start over.",
          retryAfter: rateLimitResult.retryAfter 
        },
        429
      );
    }

    // Find and verify the reset token
    const resetTokenHash = hashToken(resetToken);
    const verifiedToken = await prisma.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "RESET_VERIFIED",
        tokenHash: resetTokenHash,
      },
    });

    if (!verifiedToken) {
      return noCacheJson({ error: "Invalid or expired reset token. Please start over." }, 400);
    }

    // Check if token expired
    if (verifiedToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verifiedToken.id },
      });
      return noCacheJson({ error: "Reset token has expired. Please start over." }, 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, displayName: true, phone: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      await prisma.verificationToken.delete({
        where: { id: verifiedToken.id },
      });
      return noCacheJson({ error: "User not found. Please start over." }, 404);
    }

    // Hash the new password
    const newPasswordHash = hashPassword(password);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Delete the verified token
    await prisma.verificationToken.delete({
      where: { id: verifiedToken.id },
    });

    // Revoke all existing sessions for security
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Create a new session
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               null;
    const userAgent = request.headers.get("user-agent") || null;
    
    const { token } = await createSession(user.id, ip, userAgent);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Send notification email (non-blocking)
    sendPasswordChangedEmail(user.email).catch((err) => {
      console.error("[auth] Failed to send password changed email:", err);
    });

    console.log(`[auth] Password reset completed for ${normalizedEmail}`);

    return noCacheJson({
      success: true,
      message: "Password has been reset successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("[auth/forgot/complete] Error:", error);
    return noCacheJson({ error: "An error occurred. Please try again." }, 500);
  }
}
