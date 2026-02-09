// lib/auth/admin-session.ts
// Admin session management for Rime Couture
// - Hardcoded admin credentials (name + password)
// - 2-day inactivity expiry
// - Max 2 concurrent sessions
// - ADMIN role enforcement

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";

// ============================================================================
// CONSTANTS
// ============================================================================

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 2 * 24 * 60 * 60; // 2 days
const ADMIN_MAX_CONCURRENT_SESSIONS = 2;

const IS_PROD = process.env.NODE_ENV === "production";

// Hardcoded admin credentials
const ADMIN_NAME = "fatiha";
const ADMIN_PASSWORD = "rimezina1980";
const ADMIN_EMAIL = "heithem1980@gmail.com";

// ============================================================================
// TOKEN HELPERS
// ============================================================================

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateToken(): string {
  return randomBytes(48).toString("base64url");
}

// ============================================================================
// CREDENTIAL VERIFICATION
// ============================================================================

/**
 * Verify admin credentials against hardcoded values
 * Constant-time comparison to prevent timing attacks
 */
export function verifyAdminCredentials(
  name: string,
  password: string
): boolean {
  // Use constant-time comparison for both fields
  const nameBuffer = Buffer.from(name.toLowerCase().trim());
  const expectedNameBuffer = Buffer.from(ADMIN_NAME);

  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(ADMIN_PASSWORD);

  // Both must match — constant-time to prevent timing leaks
  let nameMatch = false;
  let passwordMatch = false;

  try {
    if (nameBuffer.length === expectedNameBuffer.length) {
      // Use timingSafeEqual only when lengths match
      nameMatch = timingSafeEqual(nameBuffer, expectedNameBuffer);
    }
  } catch {
    nameMatch = false;
  }

  try {
    if (passwordBuffer.length === expectedPasswordBuffer.length) {
      passwordMatch = timingSafeEqual(
        passwordBuffer,
        expectedPasswordBuffer
      );
    }
  } catch {
    passwordMatch = false;
  }

  return nameMatch && passwordMatch;
}

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

/**
 * Get or create the admin user record in the database.
 * Uses a stable email so the same admin user is reused.
 */
async function getOrCreateAdminUser(): Promise<string> {
  // Try to find existing admin user
  const existing = await prisma.user.findFirst({
    where: {
      email: ADMIN_EMAIL,
      role: "ADMIN",
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  // Create admin user with hashed password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: "ADMIN",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  return admin.id;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new admin session.
 * Enforces max 2 concurrent sessions — revokes the oldest if exceeded.
 */
export async function createAdminSession(
  ip?: string | null,
  userAgent?: string | null
): Promise<{ token: string }> {
  const userId = await getOrCreateAdminUser();
  const now = new Date();

  // Get all active admin sessions (not revoked, not expired)
  const activeSessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  // If at max capacity, revoke the oldest session(s)
  if (activeSessions.length >= ADMIN_MAX_CONCURRENT_SESSIONS) {
    const sessionsToRevoke = activeSessions.slice(
      0,
      activeSessions.length - ADMIN_MAX_CONCURRENT_SESSIONS + 1
    );
    await prisma.session.updateMany({
      where: {
        id: { in: sessionsToRevoke.map((s) => s.id) },
      },
      data: { revokedAt: now },
    });
  }

  // Create the new session
  const token = generateToken();
  const tokenHash = hashToken(token);

  await prisma.session.create({
    data: {
      userId,
      sessionIdHash: tokenHash,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return { token };
}

/**
 * Validate admin session from cookies.
 * Returns admin info if valid, null otherwise.
 * Also refreshes the session expiry (sliding window) on each successful validation.
 */
export async function validateAdminSession(): Promise<{
  admin: {
    id: string;
    displayName: string | null;
    email: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
} | null> {
  try {
    const token = await getAdminSessionToken();
    if (!token) return null;

    const tokenHash = hashToken(token);

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
            deletedAt: true,
          },
        },
      },
    });

    // Session doesn't exist
    if (!session) return null;

    // Session was revoked
    if (session.revokedAt) return null;

    // Session expired (2 days of inactivity)
    if (session.expiresAt <= new Date()) return null;

    // User was deleted or is not admin
    if (session.user.deletedAt || session.user.role !== "ADMIN") return null;

    // Refresh session expiry (sliding window — resets 2-day timer on activity)
    const newExpiresAt = new Date(
      Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000
    );
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    return {
      admin: {
        id: session.user.id,
        displayName: session.user.displayName,
        email: session.user.email,
      },
      session: {
        id: session.id,
        expiresAt: newExpiresAt,
      },
    };
  } catch (error) {
    console.error("[admin-session] Validation error:", error);
    return null;
  }
}

/**
 * Revoke the current admin session (logout)
 */
export async function revokeAdminSession(): Promise<void> {
  try {
    const token = await getAdminSessionToken();
    if (!token) return;

    const tokenHash = hashToken(token);

    await prisma.session.updateMany({
      where: {
        sessionIdHash: tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    console.error("[admin-session] Revoke error:", error);
  }
}

// ============================================================================
// COOKIE HELPERS
// ============================================================================

export async function getAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? null;
}

export function setAdminSessionCookie(
  res: NextResponse,
  token: string
): void {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(
  res: NextResponse
): void {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: 0,
  });
}
