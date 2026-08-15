// ============================================================
// GET /api/discovery/public-playlists
// Featured and relevant public playlists.
// ============================================================

import { authenticateRequest, withSpotifyRetry } from '@/lib/auth-middleware';
import { searchPlaylists, getTopArtists, spotifyErrorResponse } from '@/lib/spotify/client';
import { mapPlaylist } from '@/lib/utils';
import type { SpotifyPlaylistItem } from '@/types';
import type { SpotifyPlaylistRaw } from '@/lib/spotify/types';

export async function GET() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  try {
    const topArtists = await withSpotifyRetry(auth, (accessToken) => getTopArtists(accessToken, 'medium_term', 20));

    // Extract top genres from user's top artists
    const genreCounts = new Map<string, number>();
    for (const artist of topArtists) {
      if (artist?.genres) {
        for (const genre of artist.genres) {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        }
      }
    }

    // Get top 3 genres or default genres
    let topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    if (topGenres.length === 0) {
      topGenres = ['latin', 'pop', 'rock'];
    }

    const genreResults = await withSpotifyRetry(auth, (accessToken) => Promise.all(
      topGenres.map((genre) => searchPlaylists(accessToken, genre, 10)),
    ));

    const genrePlaylists: SpotifyPlaylistItem[] = genreResults
      .flatMap((playlists: SpotifyPlaylistRaw[]) => playlists)
      .filter(Boolean)
      .map(mapPlaylist);

    // Deduplicate
    const seen = new Set<string>();
    const allPlaylists: SpotifyPlaylistItem[] = [];

    for (const pl of genrePlaylists) {
      if (pl?.id && !seen.has(pl.id)) {
        seen.add(pl.id);
        allPlaylists.push(pl);
      }
    }

    return Response.json({
      data: {
        featured: [],
        forYou: allPlaylists.slice(0, 15),
        topGenres,
        all: allPlaylists.slice(0, 30),
      },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Public playlists error:', error);
    return spotifyErrorResponse(error, 'Failed to fetch public playlists');
  }
}
