// ============================================================
// POST /api/os/metrics/snapshot — Save metrics snapshot
// GET  /api/os/metrics/snapshot — (alias to history)
// ============================================================

import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { syncAllMetricsForUser } from '@/lib/spotify/sync';
import { getMetricsHistory } from '@/lib/supabase/queries';
import { spotifyErrorResponse } from '@/lib/spotify/client';

export async function POST() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const [latest] = await getMetricsHistory(auth.user.id, 1);
    if (latest?.sync_batch_id) {
      const capturedAt = new Date(latest.captured_at).getTime();
      const nextRefreshAt = capturedAt + 60 * 60 * 1000;
      if (Date.now() < nextRefreshAt) {
        return Response.json(
          { data: null, error: 'Metrics can be refreshed once per hour.', status: 429 },
          { status: 429, headers: { 'Retry-After': String(Math.ceil((nextRefreshAt - Date.now()) / 1000)) } },
        );
      }
    }

    const snapshots = await withSpotifyRetry(auth, (accessToken) => syncAllMetricsForUser(auth.user.id, accessToken));

    return Response.json({
      data: snapshots,
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('Snapshot save error:', error);
    return spotifyErrorResponse(error, 'Failed to save snapshot');
  }
}
