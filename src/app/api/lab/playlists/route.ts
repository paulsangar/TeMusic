// ============================================================
// GET /api/lab/playlists
// List all user playlists with metadata.
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getAllUserPlaylists } from '@/lib/spotify/client';
import { mapPlaylist } from '@/lib/utils';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const playlists = await getAllUserPlaylists(auth.accessToken);
    return Response.json({
      data: playlists.map(mapPlaylist),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('List playlists error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch playlists', status: 500 },
      { status: 500 },
    );
  }
}
