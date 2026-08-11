// ============================================================
// GET /api/os/metrics/recent
// Recently played tracks.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getMetricsHistory } from '@/lib/supabase/queries';
import { syncMetricsForUser } from '@/lib/spotify/sync';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    const history = await getMetricsHistory(auth.user.id, 5);
    // Since recently played is the same across time ranges, any recent snapshot is fine
    let snapshot = history[0];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isExpired = !snapshot || new Date(snapshot.captured_at) < oneHourAgo;

    if (force || isExpired) {
      snapshot = await syncMetricsForUser(auth.user.id, auth.accessToken, 'medium_term');
    }

    return Response.json({
      data: snapshot.recently_played || [],
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
