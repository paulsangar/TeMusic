// ============================================================
// POST /api/lab/create-themed-playlist
// Create a new playlist based on seeds and mood parameters.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { createPlaylist, addTracksToPlaylist, getTopTracks, spotifyErrorResponse } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { CreateThemedPlaylistRequest } from '@/types';
import type { SpotifyTrackRaw } from '@/lib/spotify/types';

export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const body: CreateThemedPlaylistRequest = await request.json();
    const {
      name,
      description,
      seedArtists,
      seedTracks,
      targetDurationMinutes = 60,
      isPublic = false,
    } = body;

    if (!name) {
      return Response.json(
        { data: null, error: 'name is required', status: 400 },
        { status: 400 },
      );
    }

    const artists = (seedArtists || []).slice(0, 2);
    const tracks = (seedTracks || []).slice(0, 2);

    // Spotify Recommendations is unavailable in Development Mode. Build a
    // deterministic personal mix from the user's own top tracks instead.
    const topTracks = await withSpotifyRetry(auth, (accessToken) => getTopTracks(accessToken, 'medium_term', 50));
    const preferredTrackIds = new Set(tracks);
    const preferredArtistIds = new Set(artists);
    const rankedTracks = [...topTracks].sort((a, b) => {
      const score = (track: SpotifyTrackRaw) =>
        (preferredTrackIds.has(track.id) ? 2 : 0) +
        (track.artists.some((artist) => preferredArtistIds.has(artist.id)) ? 1 : 0);
      return score(b) - score(a);
    });
    const selectedTracks: SpotifyTrackRaw[] = [];
    const targetMs = targetDurationMinutes * 60 * 1000;
    let currentMs = 0;
    for (const track of rankedTracks) {
      if (currentMs >= targetMs) break;
      selectedTracks.push(track);
      currentMs += track.duration_ms || 0;
    }

    if (selectedTracks.length === 0) {
      return Response.json(
        { data: null, error: 'No tracks found for the selected genres/seeds. Try different genres.', status: 400 },
        { status: 400 },
      );
    }

    // Create playlist on Spotify
    const newPlaylist = await withSpotifyRetry(auth, (accessToken) => createPlaylist(
      accessToken,
      name,
      {
        description: description || `Created by TeMusc LAB • ${selectedTracks.length} tracks`,
        isPublic,
      },
    ));

    // Add tracks
    const trackUris = selectedTracks.map((t) => t.uri).filter(Boolean);
    if (trackUris.length > 0) {
      await withSpotifyRetry(auth, (accessToken) => addTracksToPlaylist(accessToken, newPlaylist.id, trackUris));
    }

    return Response.json({
      data: {
        playlistId: newPlaylist.id,
        playlistName: name,
        trackCount: selectedTracks.length,
        totalDurationMs: selectedTracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0),
        tracks: selectedTracks.map(mapTrack),
      },
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('[Create Themed] Unexpected error:', error instanceof Error ? error.name : 'UnknownError');
    return spotifyErrorResponse(error, 'Failed to create playlist');
  }
}
