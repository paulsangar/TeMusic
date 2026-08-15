// ============================================================
// GET /api/os/metrics/recent
// Recently played tracks.
// ============================================================

import { authenticateRequest } from '@/lib/auth-middleware';
import { getMetricsHistory } from '@/lib/supabase/queries';

export async function GET() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const history = await getMetricsHistory(auth.user.id, 1);
    const snapshot = history[0];

    return Response.json({
      data: snapshot?.recently_played || [],
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
