// ============================================================
// POST /api/os/metrics/snapshot — Save metrics snapshot
// GET  /api/os/metrics/snapshot — (alias to history)
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { syncMetricsForUser } from '@/lib/spotify/sync';

export async function POST() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Sync snapshot (reads from Spotify and writes to Supabase)
    const snapshot = await syncMetricsForUser(auth.user.id, auth.accessToken, 'medium_term');

    return Response.json({
      data: snapshot,
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('Snapshot save error:', error);
    return Response.json(
      { data: null, error: 'Failed to save snapshot', status: 500 },
      { status: 500 },
    );
  }
}
