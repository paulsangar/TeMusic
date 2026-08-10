// ============================================================
// Spotify Web API Client
// Full wrapper for all Spotify endpoints TeMusc uses.
// No DJ, no mixing — standard Web API only.
// ============================================================

import type {
  SpotifyUserProfile,
  SpotifyTrackRaw,
  SpotifyArtistRaw,
  SpotifyPlaylistRaw,
  SpotifyRecentlyPlayedRaw,
  SpotifyPaginatedResponse,
  SpotifyCursorPaginatedResponse,
  SpotifyRecommendationsResponse,
  SpotifyFeaturedPlaylistsResponse,
  SpotifyPlaylistTrackRaw,
  RecommendationSeeds,
  TimeRange,
} from './types';

const BASE_URL = 'https://api.spotify.com/v1';

// ============================================================
// Internal helpers
// ============================================================

class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`Spotify API ${status}: ${statusText} — ${body}`);
    this.name = 'SpotifyApiError';
  }
}

async function spotifyFetch<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle 204 No Content (some Spotify endpoints return this)
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new SpotifyApiError(response.status, response.statusText, body);
  }

  return response.json();
}

// ============================================================
// Profile
// ============================================================

export async function getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  return spotifyFetch<SpotifyUserProfile>(accessToken, '/me');
}

// ============================================================
// Metrics (TeMusc OS)
// ============================================================

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = 'medium_term',
  limit: number = 50,
): Promise<SpotifyTrackRaw[]> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(Math.min(limit, 50)),
  });
  const response = await spotifyFetch<SpotifyPaginatedResponse<SpotifyTrackRaw>>(
    accessToken,
    `/me/top/tracks?${params}`,
  );
  return response?.items || [];
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = 'medium_term',
  limit: number = 50,
): Promise<SpotifyArtistRaw[]> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(Math.min(limit, 50)),
  });
  const response = await spotifyFetch<SpotifyPaginatedResponse<SpotifyArtistRaw>>(
    accessToken,
    `/me/top/artists?${params}`,
  );
  return response?.items || [];
}

export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 50,
): Promise<SpotifyRecentlyPlayedRaw[]> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
  });
  const response = await spotifyFetch<SpotifyCursorPaginatedResponse<SpotifyRecentlyPlayedRaw>>(
    accessToken,
    `/me/player/recently-played?${params}`,
  );
  return response?.items || [];
}

// ============================================================
// Playlists (TeMusc LAB)
// ============================================================

export async function getUserPlaylists(
  accessToken: string,
  limit: number = 50,
  offset: number = 0,
): Promise<SpotifyPaginatedResponse<SpotifyPlaylistRaw>> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
  });
  return spotifyFetch<SpotifyPaginatedResponse<SpotifyPlaylistRaw>>(
    accessToken,
    `/me/playlists?${params}`,
  );
}

/**
 * Get ALL playlists for a user (handles pagination automatically).
 */
export async function getAllUserPlaylists(
  accessToken: string,
): Promise<SpotifyPlaylistRaw[]> {
  const allPlaylists: SpotifyPlaylistRaw[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await getUserPlaylists(accessToken, limit, offset);
    allPlaylists.push(...response.items);
    if (!response.next || allPlaylists.length >= response.total) break;
    offset += limit;
  }

  return allPlaylists;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylistTrackRaw[]> {
  const allTracks: SpotifyPlaylistTrackRaw[] = [];
  let url: string | null = `/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const response: SpotifyPaginatedResponse<SpotifyPlaylistTrackRaw> = await spotifyFetch(
      accessToken,
      url,
    );
    allTracks.push(...response.items);
    url = response.next;
  }

  return allTracks;
}

export async function getPlaylist(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylistRaw> {
  return spotifyFetch<SpotifyPlaylistRaw>(accessToken, `/playlists/${playlistId}`);
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  options: {
    description?: string;
    isPublic?: boolean;
    collaborative?: boolean;
  } = {},
): Promise<SpotifyPlaylistRaw> {
  return spotifyFetch<SpotifyPlaylistRaw>(
    accessToken,
    `/users/${userId}/playlists`,
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: options.description || '',
        public: options.isPublic ?? false,
        collaborative: options.collaborative ?? false,
      }),
    },
  );
}

/**
 * Add tracks to a playlist. Handles batching (max 100 per request).
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);
    await spotifyFetch(
      accessToken,
      `/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        body: JSON.stringify({ uris: batch }),
      },
    );
  }
}

/**
 * Remove tracks from a playlist.
 */
export async function removeTracksFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);
    await spotifyFetch(
      accessToken,
      `/playlists/${playlistId}/tracks`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          tracks: batch.map((uri) => ({ uri })),
        }),
      },
    );
  }
}

/**
 * Upload a custom playlist cover image.
 * Image must be Base64 encoded JPEG, max 256 KB.
 */
export async function uploadPlaylistCover(
  accessToken: string,
  playlistId: string,
  imageBase64: string,
): Promise<void> {
  const url = `${BASE_URL}/playlists/${playlistId}/images`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
    body: imageBase64,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new SpotifyApiError(response.status, response.statusText, body);
  }
}

// ============================================================
// Discovery (TeMusc DISCOVERY)
// ============================================================

/**
 * Get all followed artists (handles cursor pagination).
 */
export async function getFollowedArtists(
  accessToken: string,
): Promise<SpotifyArtistRaw[]> {
  const allArtists: SpotifyArtistRaw[] = [];
  let after: string | undefined;

  while (true) {
    const params = new URLSearchParams({ type: 'artist', limit: '50' });
    if (after) params.set('after', after);

    const response = await spotifyFetch<{
      artists: SpotifyCursorPaginatedResponse<SpotifyArtistRaw>;
    }>(accessToken, `/me/following?${params}`);

    allArtists.push(...response.artists.items);

    if (!response.artists.next || !response.artists.cursors.after) break;
    after = response.artists.cursors.after;
  }

  return allArtists;
}

/**
 * Get track recommendations based on seeds.
 */
export async function getRecommendations(
  accessToken: string,
  seeds: RecommendationSeeds,
): Promise<SpotifyTrackRaw[]> {
  const params = new URLSearchParams();

  if (seeds.seedArtists?.length) params.set('seed_artists', seeds.seedArtists.join(','));
  if (seeds.seedTracks?.length) params.set('seed_tracks', seeds.seedTracks.join(','));
  if (seeds.seedGenres?.length) params.set('seed_genres', seeds.seedGenres.join(','));
  params.set('limit', String(seeds.limit || 20));

  if (seeds.targetEnergy !== undefined) params.set('target_energy', String(seeds.targetEnergy));
  if (seeds.targetValence !== undefined) params.set('target_valence', String(seeds.targetValence));
  if (seeds.targetDanceability !== undefined) params.set('target_danceability', String(seeds.targetDanceability));
  if (seeds.targetTempo !== undefined) params.set('target_tempo', String(seeds.targetTempo));

  const response = await spotifyFetch<SpotifyRecommendationsResponse>(
    accessToken,
    `/recommendations?${params}`,
  );
  return response.tracks;
}

/**
 * Get Spotify's featured playlists.
 */
export async function getFeaturedPlaylists(
  accessToken: string,
  limit: number = 20,
): Promise<SpotifyFeaturedPlaylistsResponse> {
  const params = new URLSearchParams({ limit: String(Math.min(limit, 50)) });
  return spotifyFetch<SpotifyFeaturedPlaylistsResponse>(
    accessToken,
    `/browse/featured-playlists?${params}`,
  );
}

/**
 * Search for playlists by query.
 */
export async function searchPlaylists(
  accessToken: string,
  query: string,
  limit: number = 20,
): Promise<SpotifyPlaylistRaw[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'playlist',
    limit: String(Math.min(limit, 50)),
  });
  const response = await spotifyFetch<{
    playlists: SpotifyPaginatedResponse<SpotifyPlaylistRaw>;
  }>(accessToken, `/search?${params}`);
  return response.playlists.items;
}
