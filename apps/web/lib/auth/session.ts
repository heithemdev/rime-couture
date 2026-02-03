// lib/auth/session.ts
// Secure session management for Rime Couture
// - SHA-256 token hashing for DB storage
// - HttpOnly secure cookies
// - Session validation with auto-renewal

import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/db";

// Session configuration
export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Hash a session token for secure DB storage
 * Uses SHA-256 which is fast and secure for this use case
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Generate a cryptographically secure session token
 * 48 bytes = 384 bits of entropy, base64url encoded
 */
export function generateSessionToken(): string {
  return randomBytes(48).toString("base64url");
}

/**
 * Set the session cookie on a Response object
 */
export function setSessionCookie(
  res: Response & { cookies: { set: (opts: object) => void } },
  token: string
): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear the session cookie on a Response object
 */
export function clearSessionCookie(
  res: Response & { cookies: { set: (opts: object) => void } }
): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Get the current session token from cookies (server-side)
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Validate the current session and return user + session data if valid
 * Returns null if no session or session is invalid/expired/revoked
 */
export async function validateSession(): Promise<{
  user: {
    id: string;
    role: string;
    email: string;
    displayName: string | null;
    phone: string | null;
  };
  session: {
    expiresAt: Date;
  };
} | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const tokenHash = hashSessionToken(token);

    const session = await prisma.session.findUnique({
      where: { sessionIdHash: tokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            role: true,
            email: true,
            displayName: true,
            phone: true,
            deletedAt: true,
          },
        },
      },
    });

    // Session doesn't exist
    if (!session) return null;

    // Session was revoked
    if (session.revokedAt) return null;

    // Session expired
    if (session.expiresAt <= new Date()) return null;

    // User was deleted
    if (session.user.deletedAt) return null;

    return {
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
        displayName: session.user.displayName,
        phone: session.user.phone,
      },
      session: {
        expiresAt: session.expiresAt,
      },
    };
  } catch (error) {
    console.error("[session] Validation error:", error);
    return null;
  }
}

/**
 * Revoke the current session (logout)
 */
export async function revokeCurrentSession(): Promise<void> {
  try {
    const token = await getSessionToken();
    if (!token) return;

    const tokenHash = hashSessionToken(token);

    await prisma.session.updateMany({
      where: {
        sessionIdHash: tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[session] Revoke error:", error);
  }
}

/**
 * Revoke all sessions for a user (password change, security concern)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[session] Revoke all error:", error);
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  ip?: string | null,
  userAgent?: string | null
): Promise<{ token: string; tokenHash: string }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  await prisma.session.create({
    data: {
      userId,
      sessionIdHash: tokenHash,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return { token, tokenHash };
}
