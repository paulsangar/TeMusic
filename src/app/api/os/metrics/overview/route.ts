// ============================================================
// GET /api/os/metrics/overview
// Combined metrics overview: top tracks, artists, recently played
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getMetricsHistory } from '@/lib/supabase/queries';
import { syncMetricsForUser } from '@/lib/spotify/sync';
import type { TimeRange } from '@/lib/spotify/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const history = await getMetricsHistory(auth.user.id, 10);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const timeRanges: TimeRange[] = ['short_term', 'medium_term', 'long_term'];
    const snapshots: Record<string, any> = {};

    for (const tr of timeRanges) {
      let snapshot = history.find(s => s.time_range === tr);
      const isExpired = !snapshot || new Date(snapshot.captured_at) < oneHourAgo;
      
      if (isExpired) {
        try {
          snapshot = await syncMetricsForUser(auth.user.id, auth.accessToken, tr);
        } catch (e) {
          console.error(`Failed to sync ${tr}:`, e);
          // If sync fails (e.g. 429), use expired if available, else empty
          if (!snapshot) snapshot = { top_tracks: [], top_artists: [], recently_played: [], activity_summary: null } as any;
        }
      }
      snapshots[tr] = snapshot;
    }

    const recentlyPlayed = snapshots['medium_term']?.recently_played || [];
    const activitySummary = snapshots['medium_term']?.activity_summary || null;
    const lastUpdated = snapshots['medium_term']?.captured_at || new Date().toISOString();

    return Response.json({
      data: {
        topTracks: {
          shortTerm: snapshots['short_term']?.top_tracks || [],
          mediumTerm: snapshots['medium_term']?.top_tracks || [],
          longTerm: snapshots['long_term']?.top_tracks || [],
        },
        topArtists: {
          shortTerm: snapshots['short_term']?.top_artists || [],
          mediumTerm: snapshots['medium_term']?.top_artists || [],
          longTerm: snapshots['long_term']?.top_artists || [],
        },
        recentlyPlayed,
        activitySummary,
        lastUpdated,
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
