/**
 * GET /api/auth/google/callback
 *
 * Handles the OAuth 2.0 callback from Google.
 * 1. Validates CSRF state
 * 2. Exchanges authorization code for access token
 * 3. Fetches user profile from Google
 * 4. Creates or links user account
 * 5. Creates session + sets cookie
 * 6. Redirects back to the app
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const IS_PROD = process.env.NODE_ENV === 'production';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

interface GoogleUserInfo {
  id: string;          // Google's unique user ID (sub)
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // ── Handle Google errors (user denied, etc.) ─────────────────
    if (error) {
      console.warn('[auth/google/callback] Google error:', error);
      return NextResponse.redirect(
        `${APP_URL}?auth_error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${APP_URL}?auth_error=missing_params`,
      );
    }

    // ── Validate CSRF state ──────────────────────────────────────
    const storedState = request.cookies.get('google_oauth_state')?.value;

    let statePayload: { csrf: string; returnTo: string };
    try {
      statePayload = JSON.parse(
        Buffer.from(stateParam, 'base64url').toString('utf-8'),
      );
    } catch {
      return NextResponse.redirect(
        `${APP_URL}?auth_error=invalid_state`,
      );
    }

    if (!storedState || storedState !== statePayload.csrf) {
      return NextResponse.redirect(
        `${APP_URL}?auth_error=state_mismatch`,
      );
    }

    // ── Exchange code for access token ───────────────────────────
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[auth/google/callback] Token exchange failed:', errBody);
      return NextResponse.redirect(
        `${APP_URL}?auth_error=token_exchange_failed`,
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // ── Fetch user profile ───────────────────────────────────────
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      console.error('[auth/google/callback] Profile fetch failed');
      return NextResponse.redirect(
        `${APP_URL}?auth_error=profile_fetch_failed`,
      );
    }

    const profile = (await profileRes.json()) as GoogleUserInfo;

    if (!profile.email || !profile.verified_email) {
      return NextResponse.redirect(
        `${APP_URL}?auth_error=email_not_verified`,
      );
    }

    const googleId = profile.id;
    const email = profile.email.toLowerCase();
    const displayName = profile.name || profile.given_name || email.split('@')[0];
    const avatarUrl = profile.picture || null;

    // ── Find or create user ──────────────────────────────────────
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        googleId: true,
        deletedAt: true,
      },
    });

    if (user?.deletedAt) {
      return NextResponse.redirect(
        `${APP_URL}?auth_error=account_deleted`,
      );
    }

    if (user) {
      // Existing user — link Google account if not already linked
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl,
            // If the user signed up via email but never verified, mark as verified now
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        // Update avatar URL in case it changed
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        });
      }
    } else {
      // Brand new user — create account (no password, Google-only)
      user = await prisma.user.create({
        data: {
          email,
          displayName,
          googleId,
          avatarUrl,
          role: 'CLIENT',
          emailVerifiedAt: new Date(), // Google email is verified by Google
          passwordHash: null,          // No password — OAuth only
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          googleId: true,
          deletedAt: true,
        },
      });
    }

    // ── Create session ───────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;
    const { token: sessionToken } = await createSession(user.id, ip, userAgent);

    // ── Redirect back to app with session cookie ─────────────────
    const returnTo = statePayload.returnTo || '/';
    const response = NextResponse.redirect(`${APP_URL}${returnTo}`);

    // Set session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // Clear CSRF cookie
    response.cookies.set({
      name: 'google_oauth_state',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[auth/google/callback] Error:', error);
    return NextResponse.redirect(
      `${APP_URL}?auth_error=internal_error`,
    );
  }
}
