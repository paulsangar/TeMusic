import { NextRequest } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/spotify/auth';
import { getUserProfile } from '@/lib/spotify/client';
import { upsertUser } from '@/lib/supabase/queries';
import { createSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const makeErrorRedirect = (err: string) =>
    new Response(null, {
      status: 302,
      headers: { Location: `http://127.0.0.1:3000/?error=${err}` },
    });

  if (error) return makeErrorRedirect('access_denied');
  if (!code) return makeErrorRedirect('no_code');

  // Leer la cookie del request
  const cookieHeader = request.headers.get('cookie') ?? '';
  const storedState = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('spotify_auth_state='))
    ?.split('=')[1];

  console.log('[Callback] state from URL:', state);
  console.log('[Callback] state from cookie:', storedState);
  console.log('[Callback] all cookies:', cookieHeader);

  if (!state || state !== storedState) {
    console.error('[Callback] State mismatch! URL:', state, 'Cookie:', storedState);
    return makeErrorRedirect('state_mismatch');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getUserProfile(tokens.access_token);
    const user = await upsertUser({
      spotifyId: profile.id,
      displayName: profile.display_name || profile.id,
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

    // Usar Web API Response nativa con headers escritos a mano
    // para máxima compatibilidad con Next.js 16 + Turbopack
    const headers = new Headers();
    headers.set('Location', 'http://127.0.0.1:3000/dashboard');
    headers.append('Set-Cookie', 
      'spotify_auth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
    headers.append('Set-Cookie',
      `temusc_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
    );

    console.log('[Callback] Success — redirecting to /dashboard');

    return new Response(null, { status: 302, headers });

  } catch (err) {
    console.error('[Callback] Full error:', err);
    const detail = err instanceof Error ? err.message : 'unknown';
    return new Response(null, {
      status: 302,
      headers: {
        Location: `http://127.0.0.1:3000/?error=auth_failed&detail=${encodeURIComponent(detail)}`,
      },
    });
  }
}
