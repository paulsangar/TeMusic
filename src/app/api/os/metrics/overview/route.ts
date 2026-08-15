// ============================================================
// GET /api/os/metrics/overview
// Combined metrics overview: top tracks, artists, recently played
// ============================================================

import { authenticateRequest } from '@/lib/auth-middleware';
import { getMetricsHistory } from '@/lib/supabase/queries';
import type { TimeRange } from '@/lib/spotify/types';
import type { MetricsSnapshotRow } from '@/lib/supabase/types';
import type { ActivitySummary, RecentlyPlayedItem, SpotifyArtistItem, SpotifyTrackItem } from '@/types';

export async function GET() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const history = await getMetricsHistory(auth.user.id, 100);
    const timeRanges: TimeRange[] = ['short_term', 'medium_term', 'long_term'];
    const snapshots: Partial<Record<TimeRange, MetricsSnapshotRow>> = {};

    const completeBatchId = history.find((candidate) => {
      if (!candidate.sync_batch_id) return false;
      const ranges = new Set(
        history
          .filter((snapshot) => snapshot.sync_batch_id === candidate.sync_batch_id)
          .map((snapshot) => snapshot.time_range),
      );
      return timeRanges.every((range) => ranges.has(range));
    })?.sync_batch_id;

    if (completeBatchId) {
      for (const tr of timeRanges) {
        snapshots[tr] = history.find(
          (snapshot) => snapshot.sync_batch_id === completeBatchId && snapshot.time_range === tr,
        );
      }
    }

    const sourceSnapshot = snapshots.medium_term ?? snapshots.short_term ?? snapshots.long_term;
    const recentlyPlayed = (sourceSnapshot?.recently_played ?? []) as RecentlyPlayedItem[];
    const activitySummary = (sourceSnapshot?.activity_summary ?? {
      byHour: {},
      byDay: {},
      totalTracksThisWeek: 0,
      uniqueArtistsThisWeek: 0,
    }) as ActivitySummary;
    const lastUpdated = sourceSnapshot?.captured_at ?? null;
    const hasData = Boolean(completeBatchId && sourceSnapshot);

    return Response.json({
      data: {
        topTracks: {
          shortTerm: (snapshots.short_term?.top_tracks ?? []) as SpotifyTrackItem[],
          mediumTerm: (snapshots.medium_term?.top_tracks ?? []) as SpotifyTrackItem[],
          longTerm: (snapshots.long_term?.top_tracks ?? []) as SpotifyTrackItem[],
        },
        topArtists: {
          shortTerm: (snapshots.short_term?.top_artists ?? []) as SpotifyArtistItem[],
          mediumTerm: (snapshots.medium_term?.top_artists ?? []) as SpotifyArtistItem[],
          longTerm: (snapshots.long_term?.top_artists ?? []) as SpotifyArtistItem[],
        },
        recentlyPlayed,
        activitySummary,
        lastUpdated,
        hasData,
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
