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
    const [playlist, trackItems] = await Promise.all([
      getPlaylist(auth.accessToken, id),
      getPlaylistTracks(auth.accessToken, id),
    ]);

    const validTracks = trackItems.filter((item) => item.track !== null);

    // Find duplicates
    const trackCounts = new Map<string, { name: string; artist: string; uris: string[] }>();
    for (const item of validTracks) {
      const track = item.track!;
      const key = `${track.name.toLowerCase()}|${track.artists[0]?.name.toLowerCase()}`;
      const existing = trackCounts.get(key);
      if (existing) {
        existing.uris.push(track.uri);
      } else {
        trackCounts.set(key, {
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
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
    // We'd need to fetch artist details for real genre data.
    // For now, count artist frequency as a proxy.
    for (const item of validTracks) {
      const artistName = item.track!.artists[0]?.name || 'Unknown';
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
    console.error('Analyze playlist error:', error);
    return Response.json(
      { data: null, error: 'Failed to analyze playlist', status: 500 },
      { status: 500 },
    );
  }
}
