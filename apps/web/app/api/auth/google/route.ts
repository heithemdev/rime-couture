/**
 * GET /api/auth/google
 *
 * Initiates Google OAuth 2.0 flow.
 * Generates CSRF state token, stores it in a short-lived httpOnly cookie,
 * then redirects the user to Google's consent screen.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const IS_PROD = process.env.NODE_ENV === 'production';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

export async function GET(request: NextRequest) {
  // Generate CSRF state token (32 bytes = 256 bits of entropy)
  const state = randomBytes(32).toString('hex');

  // Preserve the page the user was on (for post-login redirect)
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';

  // Combine state + returnTo into a single value
  const statePayload = Buffer.from(
    JSON.stringify({ csrf: state, returnTo }),
  ).toString('base64url');

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: statePayload,
    access_type: 'online',
    prompt: 'select_account', // Always show account picker
  });

  const googleUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  // Set CSRF cookie (5-minute TTL)
  const response = NextResponse.redirect(googleUrl);
  response.cookies.set({
    name: 'google_oauth_state',
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 300, // 5 minutes
  });

  return response;
}
