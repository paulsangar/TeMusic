// ============================================================
// GET /api/os/metrics/top-tracks?time_range=short_term
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import type { TimeRange } from '@/lib/spotify/types';

import { getMetricsHistory } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  const requestedRange = request.nextUrl.searchParams.get('time_range') || 'medium_term';
  const validRanges: TimeRange[] = ['short_term', 'medium_term', 'long_term'];
  if (!validRanges.includes(requestedRange as TimeRange)) {
    return Response.json(
      { data: null, error: 'Invalid time_range', status: 400 },
      { status: 400 },
    );
  }
  const timeRange = requestedRange as TimeRange;

  try {
    const history = await getMetricsHistory(auth.user.id, 100);
    const snapshot = history.find(s => s.time_range === timeRange);

    return Response.json({
      data: snapshot?.top_tracks || [],
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
