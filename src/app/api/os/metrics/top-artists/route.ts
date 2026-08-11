// ============================================================
// GET /api/os/metrics/top-artists?time_range=short_term
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getTopArtists } from '@/lib/spotify/client';
import { mapArtist } from '@/lib/utils';
import type { TimeRange } from '@/lib/spotify/types';

import { getMetricsHistory } from '@/lib/supabase/queries';
import { syncMetricsForUser } from '@/lib/spotify/sync';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const timeRange = (request.nextUrl.searchParams.get('time_range') || 'medium_term') as TimeRange;
  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    const history = await getMetricsHistory(auth.user.id, 5);
    let snapshot = history.find(s => s.time_range === timeRange);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isExpired = !snapshot || new Date(snapshot.captured_at) < oneHourAgo;

    if (force || isExpired) {
      snapshot = await syncMetricsForUser(auth.user.id, auth.accessToken, timeRange);
    }

    return Response.json({
      data: snapshot.top_artists || [],
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
