// app/api/auth/sign-in/route.ts
// Sign-in API: Authenticate user with email/password and create session

import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { csrfOk, noCacheJson, readJson, rateKey, checkRateLimit } from "@/lib/secured/secure-api";
import { createSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

// Rate limit: 5 attempts per 15 minutes per IP
const SIGN_IN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes in ms
};

interface SignInBody {
  email: string;
  password: string;
}

function validateBody(body: unknown): body is SignInBody {
  if (!body || typeof body !== "object") return false;
  const { email, password } = body as Record<string, unknown>;
  return (
    typeof email === "string" &&
    email.includes("@") &&
    email.length >= 5 &&
    typeof password === "string" &&
    password.length >= 1
  );
}

/**
 * Hash password using SHA-256
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // CSRF check
    if (!csrfOk(request)) {
      return noCacheJson({ error: "CSRF validation failed" }, 403);
    }

    // Rate limiting
    const rateLimitKey = rateKey(request, "sign-in");
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      SIGN_IN_RATE_LIMIT.maxAttempts,
      SIGN_IN_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      return noCacheJson(
        { 
          error: "Too many sign-in attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        },
        429
      );
    }

    // Parse request body
    const bodyResult = await readJson(request);
    if (!bodyResult.ok) {
      return noCacheJson({ error: "Invalid request body" }, bodyResult.status);
    }
    
    const body = bodyResult.data;
    if (!validateBody(body)) {
      return noCacheJson({ error: "Invalid email or password format" }, 400);
    }

    const { email, password } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        phone: true,
        deletedAt: true,
      },
    });

    // User not found - use generic message to prevent email enumeration
    if (!user || user.deletedAt) {
      return noCacheJson({ error: "Invalid email or password" }, 401);
    }

    // User has no password
    if (!user.passwordHash) {
      return noCacheJson({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return noCacheJson({ error: "Invalid email or password" }, 401);
    }

    // Create new session
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
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    console.log(`[auth] User signed in: ${user.email}`);

    // Return user data
    return noCacheJson({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("[auth/sign-in] Error:", error);
    return noCacheJson({ error: "An error occurred during sign-in" }, 500);
  }
}
