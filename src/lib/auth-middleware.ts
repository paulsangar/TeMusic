// ============================================================
// Auth Middleware Helper
// Ensures API routes have a valid session with fresh Spotify tokens.
// ============================================================

import { getSession } from './session';
import { getUserById, updateUserTokens } from './supabase/queries';
import { refreshAccessToken, SpotifyAuthError } from './spotify/auth';
import type { UserRow } from './supabase/types';
import { SpotifyApiError } from './spotify/client';

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
    console.error('[Auth Middleware] session user was not found');
    return null;
  }

  // Check if token is expired (with 5-minute buffer)
  const tokenExpiry = user.token_expires_at ? new Date(user.token_expires_at) : new Date(0);
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() + bufferMs >= tokenExpiry.getTime()) {
    const newTokens = await refreshAccessToken(user.refresh_token);
    await updateUserTokens(user.id, newTokens);
    return {
      user: { ...user, access_token: newTokens.access_token, refresh_token: newTokens.refresh_token },
      accessToken: newTokens.access_token,
    };
  }

  return {
    user,
    accessToken: user.access_token,
  };
}

/**
 * Helper to return a 401 JSON response.
 */
export function unauthorizedResponse(message: string = 'Not authenticated'): Response {
  return Response.json(
    { data: null, error: message, status: 401 },
    { status: 401 },
  );
}

export async function authenticateRequest(): Promise<
  { auth: AuthenticatedUser; errorResponse: null } |
  { auth: null; errorResponse: Response }
> {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return { auth: null, errorResponse: unauthorizedResponse() };
    return { auth, errorResponse: null };
  } catch (error) {
    if (error instanceof SpotifyAuthError && (error.status === 400 || error.status === 401)) {
      return {
        auth: null,
        errorResponse: unauthorizedResponse('Spotify authorization expired. Please reconnect your account.'),
      };
    }
    if (error instanceof SpotifyAuthError && error.status === 429) {
      const headers = error.retryAfter !== null
        ? { 'Retry-After': String(error.retryAfter) }
        : undefined;
      return {
        auth: null,
        errorResponse: Response.json(
          { data: null, error: 'Spotify rate limit reached. Please retry later.', status: 429 },
          { status: 429, headers },
        ),
      };
    }
    console.error('[Auth Middleware] authentication service failed:', error instanceof Error ? error.name : 'UnknownError');
    return {
      auth: null,
      errorResponse: Response.json(
        { data: null, error: 'Authentication service unavailable', status: 503 },
        { status: 503 },
      ),
    };
  }
}

/** Retry one Spotify operation after refreshing an unexpectedly rejected token. */
export async function withSpotifyRetry<T>(
  auth: AuthenticatedUser,
  operation: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    return await operation(auth.accessToken);
  } catch (error) {
    if (!(error instanceof SpotifyApiError) || error.status !== 401) throw error;

    const newTokens = await refreshAccessToken(auth.user.refresh_token);
    await updateUserTokens(auth.user.id, newTokens);
    auth.accessToken = newTokens.access_token;
    auth.user.access_token = newTokens.access_token;
    auth.user.refresh_token = newTokens.refresh_token;
    return operation(newTokens.access_token);
  }
}
