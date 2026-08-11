// ============================================================
// GET /api/lab/playlists/[id]
// Get detailed playlist with tracks.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks } from '@/lib/spotify/client';
import { mapPlaylist, mapTrack } from '@/lib/utils';

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
      console.error('[Playlist Detail] getPlaylist failed:', reason);
      return Response.json(
        { data: null, error: `Failed to fetch playlist metadata: ${reason}`, status: 500 },
        { status: 500 },
      );
    }

    const playlist = results[0].value;
    const trackItems = results[1].status === 'fulfilled' ? (results[1].value || []) : [];

    // Diagnostic logging
    console.log(`[Playlist Detail] id=${id}, playlist.name=${playlist?.name}, playlist.tracks.total=${playlist?.tracks?.total}, trackItems.length=${trackItems.length}`);

    if (results[1].status === 'rejected') {
      console.error('[Playlist Detail] getPlaylistTracks failed:', results[1].reason?.message || results[1].reason);
    }

    // Defensive filtering: some items can be null (deleted tracks, podcast episodes)
    const tracks = trackItems
      .filter((item) => item != null && (item.track != null || item.item != null))
      .map((item) => ({
        ...mapTrack((item.track || item.item)!),
        addedAt: item.added_at || '',
      }));

    console.log(`[Playlist Detail] After filtering: ${tracks.length} valid tracks out of ${trackItems.length} raw items`);

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Playlist Detail] Unexpected error:', msg);
    return Response.json(
      { data: null, error: `Failed to fetch playlist: ${msg}`, status: 500 },
      { status: 500 },
    );
  }
}

