// ============================================================
// POST /api/lab/create-themed-playlist
// Create a new playlist based on seeds and mood parameters.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getRecommendations, createPlaylist, addTracksToPlaylist } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { CreateThemedPlaylistRequest } from '@/types';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const body: CreateThemedPlaylistRequest = await request.json();
    const {
      name,
      description,
      seedArtists,
      seedTracks,
      seedGenres,
      targetDurationMinutes = 60,
      isPublic = false,
    } = body;

    if (!name) {
      return Response.json(
        { data: null, error: 'name is required', status: 400 },
        { status: 400 },
      );
    }

    // Validate we have at least one seed
    const totalSeeds = (seedArtists?.length || 0) + (seedTracks?.length || 0) + (seedGenres?.length || 0);
    if (totalSeeds === 0) {
      return Response.json(
        { data: null, error: 'At least one seed (artist, track, or genre) is required', status: 400 },
        { status: 400 },
      );
    }

    // Get recommendations (max 100)
    const targetMs = targetDurationMinutes * 60 * 1000;
    const recommended = await getRecommendations(auth.accessToken, {
      seedArtists: seedArtists?.slice(0, 5),
      seedTracks: seedTracks?.slice(0, 5),
      seedGenres: seedGenres?.slice(0, 5),
      limit: 100,
    });

    // Trim to approximate target duration
    let currentMs = 0;
    const selectedTracks = [];
    for (const track of recommended) {
      if (currentMs >= targetMs) break;
      selectedTracks.push(track);
      currentMs += track.duration_ms;
    }

    // Create playlist on Spotify
    const newPlaylist = await createPlaylist(
      auth.accessToken,
      auth.user.spotify_id,
      name,
      {
        description: description || `Created by TeMusc LAB • ${selectedTracks.length} tracks`,
        isPublic,
      },
    );

    // Add tracks
    const trackUris = selectedTracks.map((t) => t.uri);
    if (trackUris.length > 0) {
      await addTracksToPlaylist(auth.accessToken, newPlaylist.id, trackUris);
    }

    return Response.json({
      data: {
        playlistId: newPlaylist.id,
        playlistName: name,
        trackCount: selectedTracks.length,
        totalDurationMs: currentMs,
        tracks: selectedTracks.map(mapTrack),
      },
      error: null,
      status: 201,
    }, { status: 201 });
  } catch (error) {
    console.error('Create themed playlist error:', error);
    return Response.json(
      { data: null, error: 'Failed to create themed playlist', status: 500 },
      { status: 500 },
    );
  }
}
