// app/api/auth/sign-up/complete/route.ts
// Sign-up Step 2: Verify OTP and create user account

import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, checkRateLimit } from "@/lib/secured/secure-api";
import { createSession } from "@/lib/auth/session";
import { sendWelcomeEmail } from "@/lib/email/basic";
import { cookies } from "next/headers";

// Rate limit: 5 attempts per 15 minutes per email
const VERIFY_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

interface SignUpCompleteBody {
  email: string;
  code: string;
}

function validateBody(body: unknown): body is SignUpCompleteBody {
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
    const rateLimitKey = `signup-verify:${normalizedEmail}`;
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
        purpose: "SIGNUP",
      },
    });

    if (!verificationToken) {
      return noCacheJson({ error: "No verification pending for this email" }, 400);
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

    // Parse stored data
    let storedData: { otpHash: string; passwordHash: string; name: string; phone: string | null };
    try {
      storedData = JSON.parse(verificationToken.tokenHash);
    } catch {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return noCacheJson({ error: "Invalid verification data. Please start over." }, 400);
    }

    // Verify OTP
    const providedHash = hashToken(code);
    if (providedHash !== storedData.otpHash) {
      return noCacheJson({ error: "Invalid verification code" }, 400);
    }

    // Check if email is still available (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return noCacheJson({ error: "An account with this email already exists" }, 409);
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: storedData.name,
        passwordHash: storedData.passwordHash,
        phone: storedData.phone,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
      },
    });

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Create session
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               null;
    const userAgent = request.headers.get("user-agent") || null;
    
    const { token } = await createSession(newUser.id, ip, userAgent);

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

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.displayName || "there").catch((err) => {
      console.error("[auth] Failed to send welcome email:", err);
    });

    console.log(`[auth] New user created: ${newUser.email}`);

    return noCacheJson({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.displayName,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("[auth/sign-up/complete] Error:", error);
    return noCacheJson({ error: "An error occurred. Please try again." }, 500);
  }
}
