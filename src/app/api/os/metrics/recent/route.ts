// ============================================================
// GET /api/os/metrics/recent
// Recently played tracks.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getRecentlyPlayed } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

  try {
    const recent = await getRecentlyPlayed(auth.accessToken, limit);
    return Response.json({
      data: recent.map((item) => ({
        track: mapTrack(item.track),
        playedAt: item.played_at,
      })),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Recently played error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch recently played', status: 500 },
      { status: 500 },
    );
  }
}
