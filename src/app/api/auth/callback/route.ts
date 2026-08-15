import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/spotify/auth';
import { getUserProfile } from '@/lib/spotify/client';
import { upsertUser } from '@/lib/supabase/queries';
import { createSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const makeErrorRedirect = (err: string) => {
    const url = new URL('/', request.url);
    url.searchParams.set('error', err);
    return NextResponse.redirect(url);
  };

  if (error) return makeErrorRedirect('access_denied');
  if (!code) return makeErrorRedirect('no_code');

  const storedState = request.cookies.get('spotify_auth_state')?.value;

  if (!state || state !== storedState) {
    console.error('[Callback] OAuth state validation failed');
    return makeErrorRedirect('state_mismatch');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getUserProfile(tokens.access_token);
    const spotifyAccountId = profile.account_id || profile.id;
    const allowedSpotifyIds = (process.env.ALLOWED_SPOTIFY_USER_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV === 'production' && allowedSpotifyIds.length === 0) {
      console.error('[Callback] Spotify allowlist is not configured');
      return makeErrorRedirect('auth_failed');
    }
    if (allowedSpotifyIds.length > 0 && !allowedSpotifyIds.includes(spotifyAccountId)) {
      return makeErrorRedirect('access_denied');
    }

    const user = await upsertUser({
      spotifyId: spotifyAccountId,
      displayName: profile.display_name || spotifyAccountId,
      email: profile.email || '',
      country: profile.country || '',
      avatarUrl: profile.images?.[0]?.url || '',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    const token = await createSessionToken({
      userId: user.id,
      spotifyId: user.spotify_id,
    });

    const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete('spotify_auth_state');
    response.cookies.set('temusc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;

  } catch (err) {
    console.error('[Callback] Authentication failed:', err instanceof Error ? err.name : 'UnknownError');
    return makeErrorRedirect('auth_failed');
  }
}
