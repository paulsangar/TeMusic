// ============================================================
// GET /api/lab/analyze/[id]
// Analyze a playlist: duplicates, genre distribution, stats.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks, spotifyErrorResponse } from '@/lib/spotify/client';
import type { PlaylistAnalysis, DuplicateGroup } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  const { id } = await params;

  try {
    const [playlist, trackItems] = await withSpotifyRetry(auth, (accessToken) => Promise.all([
      getPlaylist(accessToken, id),
      getPlaylistTracks(accessToken, id),
    ]));

    // Defensive filtering: skip null items AND null tracks (deleted, podcasts)
    const validTracks = trackItems.filter(
      (item) => item != null && (item.track != null || item.item != null),
    );

    // Find duplicates
    const trackCounts = new Map<string, { name: string; artist: string; uris: string[] }>();
    for (const item of validTracks) {
      const track = (item.track || item.item)!;
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

    // Genre distribution (from artist names as proxy) and Year distribution
    const genreDistribution: Record<string, number> = {};
    const yearDistribution: Record<string, number> = {};
    
    for (const item of validTracks) {
      const track = (item.track || item.item)!;
      
      const artistName = track.artists?.[0]?.name || 'Unknown';
      genreDistribution[artistName] = (genreDistribution[artistName] || 0) + 1;
      
      const releaseDate = track.album?.release_date;
      if (releaseDate) {
        const year = releaseDate.substring(0, 4);
        yearDistribution[year] = (yearDistribution[year] || 0) + 1;
      } else {
        yearDistribution['Unknown'] = (yearDistribution['Unknown'] || 0) + 1;
      }
    }

    const popularityValues = validTracks
      .map((item) => (item.track || item.item)!.popularity)
      .filter((value): value is number => typeof value === 'number');
    const avgPop = popularityValues.length > 0
      ? Math.round(popularityValues.reduce((sum, value) => sum + value, 0) / popularityValues.length)
      : null;

    const analysis: PlaylistAnalysis = {
      playlistId: id,
      name: playlist.name,
      trackCount: validTracks.length,
      duplicates,
      duplicateCount: duplicates.reduce((sum, d) => sum + d.occurrences - 1, 0),
      genreDistribution,
      yearDistribution,
      averagePopularity: avgPop,
    };

    return Response.json({
      data: analysis,
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('[Analyze] Request failed:', error instanceof Error ? error.name : 'UnknownError');
    return spotifyErrorResponse(error, 'Failed to analyze complete playlist data');
  }
}
