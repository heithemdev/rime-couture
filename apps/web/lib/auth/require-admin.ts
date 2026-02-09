/**
 * Admin API guard helper
 * Import and call at the top of any /api/admin/* route handler.
 * Returns the admin session or a 401 NextResponse.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if (guard.response) return guard.response; // 401
 *   const { admin, session } = guard;
 */

import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth/admin-session";

type AdminGuardResult =
  | {
      response: NextResponse;
      admin?: undefined;
      session?: undefined;
    }
  | {
      response?: undefined;
      admin: { id: string; displayName: string | null; email: string };
      session: { id: string; expiresAt: Date };
    };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const result = await validateAdminSession();

  if (!result) {
    return {
      response: NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      ),
    };
  }

  return {
    admin: result.admin,
    session: result.session,
  };
}
