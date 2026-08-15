// ============================================================
// TeMusc — Shared Application Types
// ============================================================

// Time range options for Spotify top tracks/artists
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

// Module identifiers
export type TeMusModule = 'os' | 'lab' | 'discovery';

// Alert frequency
export type AlertFrequency = 'daily' | 'weekly' | 'monthly';

// ============================================================
// API Response Wrappers
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================
// Session / Auth
// ============================================================

export interface SessionPayload {
  userId: string;       // internal Supabase UUID
  spotifyId: string;    // Spotify user ID
  iat?: number;
  exp?: number;
}

// ============================================================
// TeMusc OS — Metrics
// ============================================================

export interface MetricsOverview {
  topTracks: {
    shortTerm: SpotifyTrackItem[];
    mediumTerm: SpotifyTrackItem[];
    longTerm: SpotifyTrackItem[];
  };
  topArtists: {
    shortTerm: SpotifyArtistItem[];
    mediumTerm: SpotifyArtistItem[];
    longTerm: SpotifyArtistItem[];
  };
  recentlyPlayed: RecentlyPlayedItem[];
  activitySummary: ActivitySummary;
  lastUpdated: string | null;
  hasData: boolean;
}

export interface ActivitySummary {
  byHour: Record<number, number>;   // hour (0-23) → count
  byDay: Record<string, number>;    // ISO date → count
  totalTracksThisWeek: number;
  uniqueArtistsThisWeek: number;
}

export interface MetricsSnapshot {
  id: string;
  userId: string;
  capturedAt: string;
  timeRange: TimeRange;
  topTracks: SpotifyTrackItem[];
  topArtists: SpotifyArtistItem[];
  recentlyPlayed: RecentlyPlayedItem[];
  activitySummary: ActivitySummary;
  aiSummary?: string;
}

// ============================================================
// TeMusc LAB — Playlists
// ============================================================

export interface PlaylistAnalysis {
  playlistId: string;
  name: string;
  trackCount: number;
  duplicates: DuplicateGroup[];
  duplicateCount: number;
  genreDistribution: Record<string, number>;
  yearDistribution: Record<string, number>;
  averagePopularity: number | null;
}

export interface DuplicateGroup {
  trackName: string;
  artistName: string;
  occurrences: number;
  uris: string[];
}

export interface CleanPlaylistRequest {
  playlistId: string;
  removeDuplicates: boolean;
  removeUnpopular: boolean;     // popularity < threshold
  popularityThreshold?: number;
  newName?: string;
}

export interface CreateThemedPlaylistRequest {
  name: string;
  description?: string;
  seedArtists?: string[];       // Spotify artist IDs
  seedTracks?: string[];        // Spotify track IDs
  seedGenres?: string[];
  targetDurationMinutes?: number;
  isPublic?: boolean;
}

// ============================================================
// TeMusc DISCOVERY
// ============================================================

export interface UnexploredArtist {
  artist: SpotifyArtistItem;
  followedSince?: string;
  recentPlayCount: number;      // how often in recently-played
  topTrackCount: number;        // how often in top tracks
  reason: string;               // "followed but rarely played"
}

export interface DiscoveryHighlight {
  title: string;
  description: string;
  type: 'unexplored' | 'trending' | 'recommendation';
  items: SpotifyTrackItem[] | SpotifyArtistItem[] | SpotifyPlaylistItem[];
  source: 'spotify' | 'perplexity' | 'gemini';
}

// ============================================================
// Spotify Items (simplified for UI consumption)
// ============================================================

export interface SpotifyTrackItem {
  id: string;
  name: string;
  uri: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    releaseDate?: string;
    releaseYear?: string;
  };
  durationMs: number;
  popularity: number | null;
  previewUrl: string | null;
  externalUrl: string;
}

export interface SpotifyArtistItem {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
  popularity: number | null;
  followers: number | null;
  externalUrl: string;
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    id: string;
    displayName: string;
  };
  trackCount: number;
  isPublic: boolean;
  isCollaborative: boolean;
  externalUrl: string;
}

export interface RecentlyPlayedItem {
  track: SpotifyTrackItem;
  playedAt: string;             // ISO datetime
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

// ============================================================
// Settings
// ============================================================

export interface AlertsConfig {
  id: string;
  userId: string;
  frequency: AlertFrequency;
  metricsEnabled: boolean;
  discoveryEnabled: boolean;
  labEnabled: boolean;
}

// ============================================================
// User
// ============================================================

export interface TeMusUser {
  id: string;
  spotifyId: string;
  displayName: string;
  email: string;
  country: string;
  avatarUrl: string;
  createdAt: string;
}
