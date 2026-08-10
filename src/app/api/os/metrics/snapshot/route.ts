// ============================================================
// POST /api/os/metrics/snapshot — Save metrics snapshot
// GET  /api/os/metrics/snapshot — (alias to history)
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getTopTracks, getTopArtists, getRecentlyPlayed } from '@/lib/spotify/client';
import { saveMetricsSnapshot } from '@/lib/supabase/queries';
import { mapTrack, mapArtist, buildActivitySummary } from '@/lib/utils';
import type { SpotifyRecentlyPlayedRaw } from '@/lib/spotify/types';

export async function POST() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Fetch current metrics
    const [tracks, artists, recentRaw] = await Promise.all([
      getTopTracks(auth.accessToken, 'medium_term', 50),
      getTopArtists(auth.accessToken, 'medium_term', 50),
      getRecentlyPlayed(auth.accessToken, 50),
    ]);

    const recentlyPlayed = recentRaw.map((item: SpotifyRecentlyPlayedRaw) => ({
      track: mapTrack(item.track),
      playedAt: item.played_at,
    }));

    const activitySummary = buildActivitySummary(recentlyPlayed);

    // Save snapshot to Supabase
    const snapshot = await saveMetricsSnapshot({
      userId: auth.user.id,
      timeRange: 'medium_term',
      topTracks: tracks.map(mapTrack),
      topArtists: artists.map(mapArtist),
      recentlyPlayed,
      activitySummary,
    });

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
