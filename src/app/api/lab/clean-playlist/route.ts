// ============================================================
// POST /api/lab/clean-playlist
// Clone a playlist with cleaning rules applied.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getPlaylist, getPlaylistTracks, createPlaylist, addTracksToPlaylist } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { CleanPlaylistRequest } from '@/types';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const body: CleanPlaylistRequest = await request.json();
    const { playlistId, removeDuplicates, removeUnpopular, popularityThreshold = 20, newName } = body;

    if (!playlistId) {
      return Response.json(
        { data: null, error: 'playlistId is required', status: 400 },
        { status: 400 },
      );
    }

    // Get original playlist and tracks
    const [originalPlaylist, trackItems] = await Promise.all([
      getPlaylist(auth.accessToken, playlistId),
      getPlaylistTracks(auth.accessToken, playlistId),
    ]);

    // Filter tracks
    let tracks = trackItems.filter((item) => item.track !== null);

    if (removeDuplicates) {
      const seen = new Set<string>();
      tracks = tracks.filter((item) => {
        const key = item.track!.uri;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (removeUnpopular) {
      tracks = tracks.filter((item) => item.track!.popularity >= popularityThreshold);
    }

    // Create new playlist
    const cleanedName = newName || `TeMusc LAB – ${originalPlaylist.name}`;
    const newPlaylist = await createPlaylist(
      auth.accessToken,
      auth.user.spotify_id,
      cleanedName,
      {
        description: `Cleaned version of "${originalPlaylist.name}" by TeMusc LAB. Original: ${trackItems.length} tracks → Cleaned: ${tracks.length} tracks.`,
        isPublic: false,
      },
    );

    // Add tracks to new playlist
    const trackUris = tracks.map((item) => item.track!.uri);
    if (trackUris.length > 0) {
      await addTracksToPlaylist(auth.accessToken, newPlaylist.id, trackUris);
    }

    return Response.json({
      data: {
        newPlaylistId: newPlaylist.id,
        newPlaylistName: cleanedName,
        originalTrackCount: trackItems.length,
        cleanedTrackCount: tracks.length,
        removedCount: trackItems.length - tracks.length,
        tracks: tracks.map((item) => mapTrack(item.track!)),
      },
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('Clean playlist error:', error);
    return Response.json(
      { data: null, error: 'Failed to clean playlist', status: 500 },
      { status: 500 },
    );
  }
}
