// ============================================================
// POST /api/lab/clean-playlist
// Clone a playlist with cleaning rules applied.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks, createPlaylist, addTracksToPlaylist, spotifyErrorResponse } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { CleanPlaylistRequest } from '@/types';

export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const body: CleanPlaylistRequest = await request.json();
    const { playlistId, removeDuplicates, removeUnpopular, newName } = body;

    if (!playlistId) {
      return Response.json(
        { data: null, error: 'playlistId is required', status: 400 },
        { status: 400 },
      );
    }

    if (removeUnpopular) {
      return Response.json(
        { data: null, error: 'Filtering by popularity is unavailable with the current Spotify API.', status: 422 },
        { status: 422 },
      );
    }

    // Both reads must complete before any playlist mutation is allowed.
    const [originalPlaylist, allTrackItems] = await withSpotifyRetry(auth, (accessToken) => Promise.all([
      getPlaylist(accessToken, playlistId),
      getPlaylistTracks(accessToken, playlistId),
    ]));

    // Normalize both the legacy `track` and current `item` payload shapes.
    let tracks = allTrackItems.filter(
      (item) => item != null && (item.item != null || item.track != null),
    );

    const originalCount = tracks.length;

    if (removeDuplicates) {
      const seen = new Set<string>();
      tracks = tracks.filter((item) => {
        const key = (item.item ?? item.track)!.uri;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Create new playlist
    const cleanedName = newName || `TeMusc LAB – ${originalPlaylist.name}`;
    const newPlaylist = await withSpotifyRetry(auth, (accessToken) => createPlaylist(
      accessToken,
      cleanedName,
      {
        description: `Cleaned version of "${originalPlaylist.name}" by TeMusc LAB. Original: ${originalCount} tracks → Cleaned: ${tracks.length} tracks.`,
        isPublic: false,
      },
    ));

    // Add tracks to new playlist
    const trackUris = tracks.map((item) => (item.item ?? item.track)!.uri);
    for (let index = 0; index < trackUris.length; index += 100) {
      const batch = trackUris.slice(index, index + 100);
      // Retry only this idempotent-sized batch, never previously added batches.
      await withSpotifyRetry(auth, (accessToken) => addTracksToPlaylist(accessToken, newPlaylist.id, batch));
    }

    return Response.json({
      data: {
        newPlaylistId: newPlaylist.id,
        newPlaylistName: cleanedName,
        originalTrackCount: originalCount,
        cleanedTrackCount: tracks.length,
        removedCount: originalCount - tracks.length,
        tracks: tracks.map((item) => mapTrack((item.item ?? item.track)!)),
      },
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('[Clean Playlist] Unexpected error:', error instanceof Error ? error.name : 'UnknownError');
    return spotifyErrorResponse(error, 'Failed to clean playlist');
  }
}
