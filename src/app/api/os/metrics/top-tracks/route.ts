// ============================================================
// GET /api/os/metrics/top-tracks?time_range=short_term
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getTopTracks } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { TimeRange } from '@/lib/spotify/types';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const timeRange = (request.nextUrl.searchParams.get('time_range') || 'medium_term') as TimeRange;
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

  try {
    const tracks = await getTopTracks(auth.accessToken, timeRange, limit);
    return Response.json({
      data: tracks.map(mapTrack),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Top tracks error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch top tracks', status: 500 },
      { status: 500 },
    );
  }
}
