// ============================================================
// GET /api/discovery/unexplored
// Artists the user follows but rarely listens to.
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFollowedArtists, getTopArtists, getRecentlyPlayed } from '@/lib/spotify/client';
import { mapArtist } from '@/lib/utils';
import type { UnexploredArtist } from '@/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Fetch followed artists, top artists (short, medium, long), and recently played in parallel safely
    const results = await Promise.allSettled([
      getFollowedArtists(auth.accessToken),
      getTopArtists(auth.accessToken, 'short_term', 50),
      getTopArtists(auth.accessToken, 'medium_term', 50),
      getTopArtists(auth.accessToken, 'long_term', 50),
      getRecentlyPlayed(auth.accessToken, 50),
    ]);

    const getValue = <T>(res: PromiseSettledResult<T>, fallback: T): T => {
      if (res.status === 'fulfilled') return res.value;
      console.error('[Unexplored Route] Endpoint fetch failed:', res.reason?.message || res.reason);
      return fallback;
    };

    const followedArtists = getValue(results[0], []).filter(Boolean);
    const topShort = getValue(results[1], []).filter(Boolean);
    const topMedium = getValue(results[2], []).filter(Boolean);
    const topLong = getValue(results[3], []).filter(Boolean);
    const recentRaw = getValue(results[4], []).filter((item) => item && item.track);

    // Build sets of actively listened-to artists
    const topArtistIds = new Set<string>();
    for (const a of [...topShort, ...topMedium, ...topLong]) {
      if (a?.id) topArtistIds.add(a.id);
    }

    // Count recent plays per artist
    const recentArtistCounts = new Map<string, number>();
    for (const item of recentRaw) {
      if (item?.track?.artists && Array.isArray(item.track.artists)) {
        for (const artist of item.track.artists) {
          if (artist?.id) {
            recentArtistCounts.set(artist.id, (recentArtistCounts.get(artist.id) || 0) + 1);
          }
        }
      }
    }

    // Find unexplored: followed but NEVER in top artists and ZERO recent plays
    const unexplored: UnexploredArtist[] = [];
    for (const artist of followedArtists) {
      const recentCount = recentArtistCounts.get(artist.id) || 0;
      const inTop = topArtistIds.has(artist.id);

      if (!inTop && recentCount === 0) {
        unexplored.push({
          artist: mapArtist(artist),
          recentPlayCount: 0,
          topTrackCount: 0,
          reason: 'You follow this artist on Spotify but haven\'t played their music recently',
        });
      }
    }

    // Sort: least played first
    unexplored.sort((a, b) => a.recentPlayCount - b.recentPlayCount);

    return Response.json({
      data: unexplored.slice(0, 30),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Unexplored artists error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch unexplored artists', status: 500 },
      { status: 500 },
    );
  }
}
