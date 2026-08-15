// ============================================================
// GET /api/lab/playlists
// List all user playlists with metadata.
// ============================================================

import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { getAllUserPlaylists, spotifyErrorResponse } from '@/lib/spotify/client';
import { mapPlaylist } from '@/lib/utils';

export async function GET() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const playlists = await withSpotifyRetry(auth, getAllUserPlaylists);
    
    return Response.json({
      data: playlists.map(mapPlaylist),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('List playlists error:', error instanceof Error ? error.name : 'UnknownError');
    return spotifyErrorResponse(error, 'Failed to fetch playlists');
  }
}
