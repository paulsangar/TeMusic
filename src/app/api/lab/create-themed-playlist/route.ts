// ============================================================
// POST /api/lab/create-themed-playlist
// Create a new playlist based on seeds and mood parameters.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getRecommendations, createPlaylist, addTracksToPlaylist, getTopTracks } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { CreateThemedPlaylistRequest } from '@/types';

// Spotify's official available genre seeds (subset — most common valid seeds)
const VALID_GENRE_SEEDS = new Set([
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient',
  'anime', 'black-metal', 'bluegrass', 'blues', 'bossanova',
  'brazil', 'breakbeat', 'british', 'cantopop', 'chicago-house',
  'children', 'chill', 'classical', 'club', 'comedy',
  'country', 'dance', 'dancehall', 'death-metal', 'deep-house',
  'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub',
  'dubstep', 'edm', 'electro', 'electronic', 'emo',
  'folk', 'forro', 'french', 'funk', 'garage',
  'german', 'gospel', 'goth', 'grindcore', 'groove',
  'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore',
  'hardstyle', 'heavy-metal', 'hip-hop', 'holidays', 'honky-tonk',
  'house', 'idm', 'indian', 'indie', 'indie-pop',
  'industrial', 'iranian', 'j-dance', 'j-idol', 'j-pop',
  'j-rock', 'jazz', 'k-pop', 'kids', 'latin',
  'latino', 'malay', 'mandopop', 'metal', 'metalcore',
  'minimal-techno', 'mpb', 'new-age', 'new-release', 'opera',
  'pagode', 'party', 'philippines-opm', 'piano', 'pop',
  'pop-film', 'post-dubstep', 'power-pop', 'progressive-house',
  'psych-rock', 'punk', 'punk-rock', 'r-n-b', 'rainy-day',
  'reggae', 'reggaeton', 'road-trip', 'rock', 'rock-n-roll',
  'rockabilly', 'romance', 'sad', 'salsa', 'samba',
  'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep',
  'songwriter', 'soul', 'soundtracks', 'spanish', 'study',
  'summer', 'swedish', 'synth-pop', 'tango', 'techno',
  'trance', 'trip-hop', 'turkish', 'work-out', 'world-music',
]);

// Map common aliases/typos to valid Spotify genre seeds
const GENRE_ALIASES: Record<string, string> = {
  'electronic': 'electro',
  'hiphop': 'hip-hop',
  'hip hop': 'hip-hop',
  'r&b': 'r-n-b',
  'rnb': 'r-n-b',
  'workout': 'work-out',
  'classic-rock': 'rock',
  'classic rock': 'rock',
  'world': 'world-music',
  'new age': 'new-age',
};

function sanitizeGenre(genre: string): string | null {
  const cleaned = genre.trim().toLowerCase();
  if (VALID_GENRE_SEEDS.has(cleaned)) return cleaned;
  if (GENRE_ALIASES[cleaned]) return GENRE_ALIASES[cleaned];
  // Try with hyphens
  const hyphenated = cleaned.replace(/\s+/g, '-');
  if (VALID_GENRE_SEEDS.has(hyphenated)) return hyphenated;
  return null;
}

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

    // Sanitize genres: map to valid Spotify seeds, drop invalid ones
    const validGenres = (seedGenres || [])
      .map(sanitizeGenre)
      .filter((g): g is string => g !== null);

    // Ensure total seeds don't exceed 5 (Spotify limit)
    const artists = (seedArtists || []).slice(0, 2);
    const tracks = (seedTracks || []).slice(0, 2);
    const genres = validGenres.slice(0, 5 - artists.length - tracks.length);

    const totalSeeds = artists.length + tracks.length + genres.length;

    // Try to get recommendations from Spotify
    let selectedTracks: Awaited<ReturnType<typeof getRecommendations>> = [];
    const targetMs = targetDurationMinutes * 60 * 1000;

    if (totalSeeds > 0) {
      try {
        const recommended = await getRecommendations(auth.accessToken, {
          seedArtists: artists.length > 0 ? artists : undefined,
          seedTracks: tracks.length > 0 ? tracks : undefined,
          seedGenres: genres.length > 0 ? genres : undefined,
          limit: 100,
        });

        // Trim to approximate target duration
        let currentMs = 0;
        for (const track of recommended) {
          if (currentMs >= targetMs) break;
          selectedTracks.push(track);
          currentMs += track.duration_ms || 0;
        }
      } catch (recError) {
        console.error('[Create Themed] Recommendations API failed:', recError instanceof Error ? recError.message : recError);
        // Fall through to fallback
      }
    }

    // Fallback: if no tracks from recommendations, use user's top tracks
    if (selectedTracks.length === 0) {
      console.warn('[Create Themed] Using fallback: fetching user top tracks');
      try {
        const topTracks = await getTopTracks(auth.accessToken, 'medium_term', 50);
        let currentMs = 0;
        for (const track of topTracks) {
          if (currentMs >= targetMs) break;
          selectedTracks.push(track);
          currentMs += track.duration_ms || 0;
        }
      } catch (fallbackError) {
        console.error('[Create Themed] Fallback top tracks also failed:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        return Response.json(
          { data: null, error: 'Could not generate track recommendations. Please try again.', status: 500 },
          { status: 500 },
        );
      }
    }

    if (selectedTracks.length === 0) {
      return Response.json(
        { data: null, error: 'No tracks found for the selected genres/seeds. Try different genres.', status: 400 },
        { status: 400 },
      );
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
    const trackUris = selectedTracks.map((t) => t.uri).filter(Boolean);
    if (trackUris.length > 0) {
      await addTracksToPlaylist(auth.accessToken, newPlaylist.id, trackUris);
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Create Themed] Unexpected error:', msg);
    return Response.json(
      { data: null, error: `Failed to create playlist: ${msg}`, status: 500 },
      { status: 500 },
    );
  }
}

