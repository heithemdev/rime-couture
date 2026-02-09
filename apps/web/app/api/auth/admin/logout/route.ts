/**
 * Admin Logout API Route
 * POST /api/auth/admin/logout
 *
 * Revokes the current admin session and clears the admin cookie.
 */

import { NextResponse } from "next/server";
import {
  revokeAdminSession,
  clearAdminSessionCookie,
} from "@/lib/auth/admin-session";

export async function POST() {
  try {
    // Revoke the admin session in DB
    await revokeAdminSession();

    // Build response and clear cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    clearAdminSessionCookie(response);

    // Also clear any legacy cookie with old path=/admin
    // Use raw header.append to avoid overwriting the path=/ clear above
    response.headers.append(
      'Set-Cookie',
      'admin_session=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Lax'
    );

    return response;
  } catch (error) {
    console.error("[admin-logout] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
