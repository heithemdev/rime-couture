// app/api/auth/logout/route.ts
// Logout: Revoke session and clear cookie

import { NextRequest } from "next/server";
import { csrfOk, noCacheJson } from "@/lib/secured/secure-api";
import { revokeCurrentSession, getSessionToken } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // CSRF check
    if (!csrfOk(request)) {
      return noCacheJson({ error: "CSRF validation failed" }, 403);
    }

    // Get current session token
    const sessionToken = await getSessionToken();

    if (sessionToken) {
      // Revoke the session in database
      await revokeCurrentSession();
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    console.log("[auth] User logged out");

    return noCacheJson({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("[auth/logout] Error:", error);
    
    // Even on error, clear the cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    
    return noCacheJson({
      success: true,
      message: "Logged out successfully",
    });
  }
}

// Also support GET for simple logout links
export async function GET(): Promise<Response> {
  try {
    const sessionToken = await getSessionToken();

    if (sessionToken) {
      await revokeCurrentSession();
    }

    // Clear cookie and redirect to home
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.error("[auth/logout] GET Error:", error);
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }
}
