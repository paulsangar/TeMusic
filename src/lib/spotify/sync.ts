import { getTopTracks, getTopArtists, getRecentlyPlayed } from './client';
import { saveMetricsSnapshot, saveMetricsSnapshots } from '../supabase/queries';
import { buildActivitySummary, mapTrack, mapArtist } from '../utils';
import type { TimeRange } from './types';

const TIME_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term'];

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

/**
 * Refresh all dashboard periods while fetching recently-played only once.
 * No database writes occur unless every Spotify read succeeds.
 */
export async function syncAllMetricsForUser(userId: string, accessToken: string) {
  const recentPromise = getRecentlyPlayed(accessToken, 50);
  const rangePromises = TIME_RANGES.map(async (timeRange) => {
    const [tracks, artists] = await Promise.all([
      getTopTracks(accessToken, timeRange, 50),
      getTopArtists(accessToken, timeRange, 50),
    ]);
    return { timeRange, tracks, artists };
  });

  const [recent, rangeData] = await Promise.all([
    recentPromise,
    Promise.all(rangePromises),
  ]);
  const mappedRecent = recent.map((item) => ({
    track: mapTrack(item.track),
    playedAt: item.played_at,
  }));
  const activitySummary = buildActivitySummary(mappedRecent);

  const syncBatchId = crypto.randomUUID();
  return saveMetricsSnapshots(rangeData.map(({ timeRange, tracks, artists }) => ({
      userId,
      timeRange,
      syncBatchId,
      topTracks: tracks.map(mapTrack),
      topArtists: artists.map(mapArtist),
      recentlyPlayed: mappedRecent,
      activitySummary,
  })));
}
