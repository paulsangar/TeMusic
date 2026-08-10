// ============================================================
// Spotify API Type Definitions (raw API responses)
// ============================================================

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;     // seconds
  scope: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  country: string;
  images: SpotifyImageRaw[];
  followers: { total: number };
  product: string;
  external_urls: { spotify: string };
}

export interface SpotifyImageRaw {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyTrackRaw {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtistSimple[];
  album: {
    id: string;
    name: string;
    images: SpotifyImageRaw[];
    release_date: string;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyArtistSimple {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

export interface SpotifyArtistRaw {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImageRaw[];
  popularity: number;
  followers: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyPlaylistRaw {
  id: string;
  name: string;
  description: string;
  images: SpotifyImageRaw[];
  owner: {
    id: string;
    display_name: string;
  };
  tracks: { total: number; items?: SpotifyPlaylistTrackRaw[] };
  public: boolean;
  collaborative: boolean;
  external_urls: { spotify: string };
  snapshot_id: string;
}

export interface SpotifyPlaylistTrackRaw {
  added_at: string;
  track: SpotifyTrackRaw | null;  // can be null for removed tracks
}

export interface SpotifyRecentlyPlayedRaw {
  track: SpotifyTrackRaw;
  played_at: string;
}

export interface SpotifyPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyCursorPaginatedResponse<T> {
  items: T[];
  next: string | null;
  cursors: {
    after: string | null;
    before: string | null;
  };
  limit: number;
  total?: number;
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrackRaw[];
  seeds: SpotifyRecommendationSeed[];
}

export interface SpotifyRecommendationSeed {
  id: string;
  type: 'artist' | 'track' | 'genre';
  initialPoolSize: number;
  afterFilteringSize: number;
  afterRelinkingSize: number;
}

export interface SpotifyFeaturedPlaylistsResponse {
  message: string;
  playlists: SpotifyPaginatedResponse<SpotifyPlaylistRaw>;
}

// Seeds for recommendations endpoint
export interface RecommendationSeeds {
  seedArtists?: string[];   // max 5 combined
  seedTracks?: string[];
  seedGenres?: string[];
  limit?: number;
  // Tunable attributes
  targetEnergy?: number;
  targetValence?: number;
  targetDanceability?: number;
  targetTempo?: number;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
