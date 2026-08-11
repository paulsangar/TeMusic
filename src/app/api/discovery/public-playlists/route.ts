// ============================================================
// GET /api/discovery/public-playlists
// Featured and relevant public playlists.
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFeaturedPlaylists, searchPlaylists, getTopArtists } from '@/lib/spotify/client';
import { mapPlaylist } from '@/lib/utils';
import type { SpotifyPlaylistItem } from '@/types';
import type { SpotifyPlaylistRaw } from '@/lib/spotify/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    // Get featured playlists and user's top artists safely
    const results = await Promise.allSettled([
      getFeaturedPlaylists(auth.accessToken, 20),
      getTopArtists(auth.accessToken, 'medium_term', 20),
    ]);

    const featuredRaw = results[0].status === 'fulfilled' ? results[0].value?.playlists?.items || [] : [];
    const topArtists = results[1].status === 'fulfilled' ? results[1].value || [] : [];

    const featured = featuredRaw.filter(Boolean).map(mapPlaylist);

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

    // Search for playlists matching top genres safely
    const genreResults = await Promise.allSettled(
      topGenres.map((genre) => searchPlaylists(auth.accessToken, genre, 10)),
    );

    const genrePlaylists: SpotifyPlaylistItem[] = genreResults
      .filter((r): r is PromiseFulfilledResult<SpotifyPlaylistRaw[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value || [])
      .filter(Boolean)
      .map(mapPlaylist);

    // Deduplicate
    const seen = new Set<string>();
    const allPlaylists: SpotifyPlaylistItem[] = [];

    for (const pl of [...featured, ...genrePlaylists]) {
      if (pl?.id && !seen.has(pl.id)) {
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
