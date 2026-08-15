// ============================================================
// GET /api/lab/playlists/[id]
// Get detailed playlist with tracks.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks, spotifyErrorResponse } from '@/lib/spotify/client';
import { mapPlaylist, mapTrack } from '@/lib/utils';

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

    // Defensive filtering: some items can be null (deleted tracks, podcast episodes)
    const tracks = trackItems
      .filter((item) => item != null && (item.track != null || item.item != null))
      .map((item) => ({
        ...mapTrack((item.track || item.item)!),
        addedAt: item.added_at || '',
      }));

    return Response.json({
      data: {
        ...mapPlaylist(playlist),
        trackCount: tracks.length,  // override with real loaded count
        tracks,
      },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('[Playlist Detail] Request failed:', error instanceof Error ? error.name : 'UnknownError');
    return spotifyErrorResponse(error, 'Failed to fetch complete playlist data');
  }
}
