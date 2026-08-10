// ============================================================
// GET /api/discovery/public-playlists
// Featured and relevant public playlists.
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFeaturedPlaylists, searchPlaylists, getTopArtists } from '@/lib/spotify/client';
import { mapPlaylist } from '@/lib/utils';
import type { SpotifyPlaylistItem } from '@/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Get featured playlists and user's top genres
    const [featuredResponse, topArtists] = await Promise.all([
      getFeaturedPlaylists(auth.accessToken, 20),
      getTopArtists(auth.accessToken, 'medium_term', 20),
    ]);

    const featured = featuredResponse.playlists.items.map(mapPlaylist);

    // Extract top genres from user's top artists
    const genreCounts = new Map<string, number>();
    for (const artist of topArtists) {
      for (const genre of artist.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      }
    }

    // Get top 3 genres
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Search for playlists matching top genres
    const genrePlaylistsArrays = await Promise.all(
      topGenres.map((genre) => searchPlaylists(auth.accessToken, genre, 10)),
    );

    const genrePlaylists: SpotifyPlaylistItem[] = genrePlaylistsArrays
      .flat()
      .map(mapPlaylist);

    // Deduplicate
    const seen = new Set<string>();
    const allPlaylists: SpotifyPlaylistItem[] = [];

    for (const pl of [...featured, ...genrePlaylists]) {
      if (!seen.has(pl.id)) {
        seen.add(pl.id);
        allPlaylists.push(pl);
      }
    }

    return Response.json({
      data: {
        featured: featured.slice(0, 10),
        forYou: genrePlaylists.slice(0, 15),
        topGenres,
        all: allPlaylists.slice(0, 30),
      },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Public playlists error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch public playlists', status: 500 },
      { status: 500 },
    );
  }
}
