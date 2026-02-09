/**
 * Admin Me API Route
 * GET /api/auth/admin/me
 *
 * Returns the current admin's info if authenticated, 401 otherwise.
 * Also refreshes the session sliding window.
 */

import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth/admin-session";

export async function GET() {
  try {
    const result = await validateAdminSession();

    if (!result) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: result.admin.id,
        name: result.admin.displayName,
        email: result.admin.email,
      },
      session: {
        expiresAt: result.session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin-me] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
