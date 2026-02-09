/**
 * Admin Login API Route
 * POST /api/auth/admin/login
 *
 * Validates hardcoded admin credentials, creates session with ADMIN role,
 * enforces max 2 concurrent sessions, sets httpOnly cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createAdminSession,
  setAdminSessionCookie,
} from "@/lib/auth/admin-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password } = body;

    // Validate input
    if (!name || typeof name !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    // Verify credentials against hardcoded values
    if (!verifyAdminCredentials(name, password)) {
      // Generic error to prevent enumeration
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Extract client info for session
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    // Create admin session (enforces max 2 concurrent)
    const { token } = await createAdminSession(ip, userAgent);

    // Build response and set cookie
    const response = NextResponse.json(
      {
        success: true,
        admin: { name: "fatiha" },
      },
      { status: 200 }
    );

    setAdminSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[admin-login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
