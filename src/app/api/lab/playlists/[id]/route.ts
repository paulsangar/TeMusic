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
    const [playlist, trackItems] = await Promise.all([
      getPlaylist(auth.accessToken, id),
      getPlaylistTracks(auth.accessToken, id),
    ]);

    const tracks = trackItems
      .filter((item) => item.track !== null)
      .map((item) => ({
        ...mapTrack(item.track!),
        addedAt: item.added_at,
      }));

    return Response.json({
      data: {
        ...mapPlaylist(playlist),
        tracks,
      },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Playlist detail error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch playlist', status: 500 },
      { status: 500 },
    );
  }
}
