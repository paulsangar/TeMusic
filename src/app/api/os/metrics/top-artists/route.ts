// ============================================================
// GET /api/os/metrics/top-artists?time_range=short_term
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getTopArtists } from '@/lib/spotify/client';
import { mapArtist } from '@/lib/utils';
import type { TimeRange } from '@/lib/spotify/types';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const timeRange = (request.nextUrl.searchParams.get('time_range') || 'medium_term') as TimeRange;
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

  try {
    const artists = await getTopArtists(auth.accessToken, timeRange, limit);
    return Response.json({
      data: (artists || []).filter(Boolean).map(mapArtist),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Top artists error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch top artists', status: 500 },
      { status: 500 },
    );
  }
}
