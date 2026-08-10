// ============================================================
// GET /api/os/metrics/overview
// Combined metrics overview: top tracks, artists, recently played
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getTopTracks, getTopArtists, getRecentlyPlayed } from '@/lib/spotify/client';
import { mapTrack, mapArtist, buildActivitySummary } from '@/lib/utils';
import type { SpotifyRecentlyPlayedRaw } from '@/lib/spotify/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Fetch all data in parallel safely with Promise.allSettled
    const results = await Promise.allSettled([
      getTopTracks(auth.accessToken, 'short_term', 20),
      getTopTracks(auth.accessToken, 'medium_term', 20),
      getTopTracks(auth.accessToken, 'long_term', 20),
      getTopArtists(auth.accessToken, 'short_term', 20),
      getTopArtists(auth.accessToken, 'medium_term', 20),
      getTopArtists(auth.accessToken, 'long_term', 20),
      getRecentlyPlayed(auth.accessToken, 50),
    ]);

    const getValue = <T>(res: PromiseSettledResult<T>, fallback: T): T => {
      if (res.status === 'fulfilled') return res.value;
      console.error('[Overview Route] Endpoint fetch failed:', res.reason?.message || res.reason);
      return fallback;
    };

    const shortTracks = getValue(results[0], []).filter(Boolean);
    const mediumTracks = getValue(results[1], []).filter(Boolean);
    const longTracks = getValue(results[2], []).filter(Boolean);
    const shortArtists = getValue(results[3], []).filter(Boolean);
    const mediumArtists = getValue(results[4], []).filter(Boolean);
    const longArtists = getValue(results[5], []).filter(Boolean);
    const recentRaw = getValue(results[6], []).filter((item) => item && item.track);

    const recentlyPlayed = recentRaw.map((item: SpotifyRecentlyPlayedRaw) => ({
      track: mapTrack(item.track),
      playedAt: item.played_at,
    }));

    const activitySummary = buildActivitySummary(recentlyPlayed);

    return Response.json({
      data: {
        topTracks: {
          shortTerm: shortTracks.map(mapTrack),
          mediumTerm: mediumTracks.map(mapTrack),
          longTerm: longTracks.map(mapTrack),
        },
        topArtists: {
          shortTerm: shortArtists.map(mapArtist),
          mediumTerm: mediumArtists.map(mapArtist),
          longTerm: longArtists.map(mapArtist),
        },
        recentlyPlayed,
        activitySummary,
      },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Metrics overview error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch metrics', status: 500 },
      { status: 500 },
    );
  }
}
