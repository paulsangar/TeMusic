import { buildAuthorizationUrl } from '@/lib/spotify/auth';
import { generateState } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const state = generateState();
  const authUrl = buildAuthorizationUrl(state);

  // Usamos Web API Response nativa (no NextResponse) para garantizar
  // que el Set-Cookie se propague correctamente en el 302.
  // sameSite=Lax es requerido para que la cookie viaje en el redirect de Spotify.
  const cookieStr = [
    `spotify_auth_state=${state}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
  ].join('; ');

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl,
      'Set-Cookie': cookieStr,
    },
  });
}
