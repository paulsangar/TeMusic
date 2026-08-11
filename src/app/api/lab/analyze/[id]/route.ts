// ============================================================
// GET /api/lab/analyze/[id]
// Analyze a playlist: duplicates, genre distribution, stats.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks } from '@/lib/spotify/client';
import type { PlaylistAnalysis, DuplicateGroup } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const { id } = await params;

  try {
    const results = await Promise.allSettled([
      getPlaylist(auth.accessToken, id),
      getPlaylistTracks(auth.accessToken, id),
    ]);

    if (results[0].status === 'rejected') {
      const reason = results[0].reason?.message || String(results[0].reason);
      console.error('[Analyze] getPlaylist failed:', reason);
      return Response.json(
        { data: null, error: `Failed to analyze playlist: ${reason}`, status: 500 },
        { status: 500 },
      );
    }

    const playlist = results[0].value;
    const trackItems = results[1].status === 'fulfilled' ? (results[1].value || []) : [];

    if (results[1].status === 'rejected') {
      console.error('[Analyze] getPlaylistTracks failed:', results[1].reason?.message || results[1].reason);
    }

    // Defensive filtering: skip null items AND null tracks (deleted, podcasts)
    const validTracks = trackItems.filter(
      (item) => item != null && item.track != null,
    );

    // Find duplicates
    const trackCounts = new Map<string, { name: string; artist: string; uris: string[] }>();
    for (const item of validTracks) {
      const track = item.track!;
      const artistName = track.artists?.[0]?.name || 'Unknown';
      const key = `${(track.name || '').toLowerCase()}|${artistName.toLowerCase()}`;
      const existing = trackCounts.get(key);
      if (existing) {
        existing.uris.push(track.uri);
      } else {
        trackCounts.set(key, {
          name: track.name || 'Unknown',
          artist: artistName,
          uris: [track.uri],
        });
      }
    }

    const duplicates: DuplicateGroup[] = [];
    for (const [, value] of trackCounts) {
      if (value.uris.length > 1) {
        duplicates.push({
          trackName: value.name,
          artistName: value.artist,
          occurrences: value.uris.length,
          uris: value.uris,
        });
      }
    }

    // Genre distribution (from artist names as proxy — full genre analysis needs artist lookups)
    const genreDistribution: Record<string, number> = {};
    for (const item of validTracks) {
      const artistName = item.track!.artists?.[0]?.name || 'Unknown';
      genreDistribution[artistName] = (genreDistribution[artistName] || 0) + 1;
    }

    // Average popularity
    const totalPop = validTracks.reduce((sum, item) => sum + (item.track!.popularity || 0), 0);
    const avgPop = validTracks.length > 0 ? Math.round(totalPop / validTracks.length) : 0;

    const analysis: PlaylistAnalysis = {
      playlistId: id,
      name: playlist.name,
      trackCount: validTracks.length,
      duplicates,
      duplicateCount: duplicates.reduce((sum, d) => sum + d.occurrences - 1, 0),
      genreDistribution,
      averagePopularity: avgPop,
    };

    return Response.json({
      data: analysis,
      error: null,
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Analyze] Unexpected error:', msg);
    return Response.json(
      { data: null, error: `Failed to analyze playlist: ${msg}`, status: 500 },
      { status: 500 },
    );
  }
}

