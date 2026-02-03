// app/api/auth/me/route.ts
// Get current authenticated user

import { noCacheJson } from "@/lib/secured/secure-api";
import { validateSession } from "@/lib/auth/session";

export async function GET(): Promise<Response> {
  try {
    const result = await validateSession();

    if (!result) {
      return noCacheJson({ 
        authenticated: false,
        user: null 
      });
    }

    const { user, session } = result;

    return noCacheJson({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        phone: user.phone,
      },
      session: {
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("[auth/me] Error:", error);
    return noCacheJson({ 
      authenticated: false,
      user: null 
    });
  }
}
