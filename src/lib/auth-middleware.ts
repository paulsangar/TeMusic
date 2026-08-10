// ============================================================
// Auth Middleware Helper
// Ensures API routes have a valid session with fresh Spotify tokens.
// ============================================================

import { getSession } from './session';
import { getUserById, updateUserTokens } from './supabase/queries';
import { refreshAccessToken } from './spotify/auth';
import type { UserRow } from './supabase/types';

export interface AuthenticatedUser {
  user: UserRow;
  accessToken: string;
}

/**
 * Verify the session and return the user with a valid Spotify access token.
 * Automatically refreshes the token if expired.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  if (!session) {
    console.error('[Auth Middleware] getSession() returned null');
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    console.error('[Auth Middleware] getUserById returned null for userId:', session.userId);
    return null;
  }

  // Check if token is expired (with 5-minute buffer)
  const tokenExpiry = user.token_expires_at ? new Date(user.token_expires_at) : new Date(0);
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() + bufferMs >= tokenExpiry.getTime()) {
    try {
      const newTokens = await refreshAccessToken(user.refresh_token);
      await updateUserTokens(user.id, newTokens);
      return {
        user: { ...user, access_token: newTokens.access_token, refresh_token: newTokens.refresh_token },
        accessToken: newTokens.access_token,
      };
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      return null;
    }
  }

  return {
    user,
    accessToken: user.access_token,
  };
}

/**
 * Helper to return a 401 JSON response.
 */
export function unauthorizedResponse(): Response {
  return Response.json(
    { data: null, error: 'Not authenticated', status: 401 },
    { status: 401 },
  );
}
