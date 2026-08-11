import { getTopTracks, getTopArtists, getRecentlyPlayed } from './client';
import { saveMetricsSnapshot } from '../supabase/queries';
import { buildActivitySummary, mapTrack, mapArtist } from '../utils';
import type { TimeRange } from './types';

export async function syncMetricsForUser(userId: string, accessToken: string, timeRange: TimeRange = 'medium_term') {
  const [tracks, artists, recent] = await Promise.all([
    getTopTracks(accessToken, timeRange, 50),
    getTopArtists(accessToken, timeRange, 50),
    getRecentlyPlayed(accessToken, 50),
  ]);

  const mappedRecent = recent.map((item) => ({
    track: mapTrack(item.track),
    playedAt: item.played_at,
  }));

  const activitySummary = buildActivitySummary(mappedRecent);

  return saveMetricsSnapshot({
    userId,
    timeRange,
    topTracks: tracks.map(mapTrack),
    topArtists: artists.map(mapArtist),
    recentlyPlayed: mappedRecent,
    activitySummary,
  });
}
