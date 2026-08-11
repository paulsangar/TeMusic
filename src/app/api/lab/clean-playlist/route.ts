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

    // Get original playlist and tracks with resilience
    const results = await Promise.allSettled([
      getPlaylist(auth.accessToken, playlistId),
      getPlaylistTracks(auth.accessToken, playlistId),
    ]);

    if (results[0].status === 'rejected') {
      const reason = results[0].reason?.message || String(results[0].reason);
      console.error('[Clean Playlist] getPlaylist failed:', reason);
      return Response.json(
        { data: null, error: `Failed to load playlist: ${reason}`, status: 500 },
        { status: 500 },
      );
    }

    if (results[1].status === 'rejected') {
      const reason = results[1].reason?.message || String(results[1].reason);
      console.error('[Clean Playlist] getPlaylistTracks failed:', reason);
      return Response.json(
        { data: null, error: `Failed to load tracks: ${reason}`, status: 500 },
        { status: 500 },
      );
    }

    const originalPlaylist = results[0].value;
    const allTrackItems = results[1].value || [];

    // Defensive: filter null items AND null tracks
    let tracks = allTrackItems.filter(
      (item) => item != null && item.track != null,
    );

    const originalCount = tracks.length;

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
      tracks = tracks.filter((item) => (item.track!.popularity || 0) >= popularityThreshold);
    }

    // Create new playlist
    const cleanedName = newName || `TeMusc LAB – ${originalPlaylist.name}`;
    const newPlaylist = await createPlaylist(
      auth.accessToken,
      auth.user.spotify_id,
      cleanedName,
      {
        description: `Cleaned version of "${originalPlaylist.name}" by TeMusc LAB. Original: ${originalCount} tracks → Cleaned: ${tracks.length} tracks.`,
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
        originalTrackCount: originalCount,
        cleanedTrackCount: tracks.length,
        removedCount: originalCount - tracks.length,
        tracks: tracks.map((item) => mapTrack(item.track!)),
      },
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Clean Playlist] Unexpected error:', msg);
    return Response.json(
      { data: null, error: `Failed to clean playlist: ${msg}`, status: 500 },
      { status: 500 },
    );
  }
}

