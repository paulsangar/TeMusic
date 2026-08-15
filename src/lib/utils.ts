// ============================================================
// General Utilities
// ============================================================

import type { SpotifyTrackRaw, SpotifyArtistRaw, SpotifyPlaylistRaw } from './spotify/types';
import type { SpotifyTrackItem, SpotifyArtistItem, SpotifyPlaylistItem, RecentlyPlayedItem, ActivitySummary } from '@/types';

// ============================================================
// Spotify Data Mappers (raw API → app types)
// ============================================================

export function mapTrack(raw: SpotifyTrackRaw): SpotifyTrackItem {
  if (!raw) {
    return {
      id: '',
      name: 'Unknown Track',
      uri: '',
      artists: [],
      album: { id: '', name: 'Unknown Album', images: [] },
      durationMs: 0,
      popularity: null,
      previewUrl: null,
      externalUrl: '',
    };
  }

  const artists = Array.isArray(raw.artists)
    ? raw.artists.map((a) => ({ id: a?.id || '', name: a?.name || 'Unknown Artist' }))
    : [];

  const images = Array.isArray(raw.album?.images) ? raw.album.images : [];

  const releaseDate = raw.album?.release_date || '';
  const releaseYear = releaseDate ? releaseDate.split('-')[0] : '';

  return {
    id: raw.id || '',
    name: raw.name || 'Untitled Track',
    uri: raw.uri || '',
    artists,
    album: {
      id: raw.album?.id || '',
      name: raw.album?.name || 'Unknown Album',
      images,
      releaseDate,
      releaseYear,
    },
    durationMs: raw.duration_ms || 0,
    popularity: raw.popularity ?? null,
    previewUrl: raw.preview_url || null,
    externalUrl: raw.external_urls?.spotify || '',
  };
}

export function mapArtist(raw: SpotifyArtistRaw): SpotifyArtistItem {
  if (!raw) {
    return {
      id: '',
      name: 'Unknown Artist',
      genres: [],
      images: [],
      popularity: null,
      followers: null,
      externalUrl: '',
    };
  }

  return {
    id: raw.id || '',
    name: raw.name || 'Unknown Artist',
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    images: Array.isArray(raw.images) ? raw.images : [],
    popularity: raw.popularity ?? null,
    followers: raw.followers?.total ?? null,
    externalUrl: raw.external_urls?.spotify || '',
  };
}

export function mapPlaylist(raw: SpotifyPlaylistRaw): SpotifyPlaylistItem {
  if (!raw) {
    return {
      id: '',
      name: 'Unknown Playlist',
      description: '',
      images: [],
      owner: { id: '', displayName: 'Unknown' },
      trackCount: 0,
      isPublic: false,
      isCollaborative: false,
      externalUrl: '',
    };
  }

  return {
    id: raw.id || '',
    name: raw.name || 'Untitled Playlist',
    description: raw.description || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    owner: {
      id: raw.owner?.id || '',
      displayName: raw.owner?.display_name || raw.owner?.id || 'Unknown Owner',
    },
    // Spotify sometimes returns tracks under 'items' (e.g., in /me/playlists) 
    // or 'tracks' (in /playlists/{id}).
    trackCount: raw.tracks?.total ?? raw.items?.total ?? 0,
    isPublic: raw.public ?? false,
    isCollaborative: raw.collaborative ?? false,
    externalUrl: raw.external_urls?.spotify || '',
  };
}

// ============================================================
// Activity Summary Builder
// ============================================================

export function buildActivitySummary(
  recentlyPlayed: RecentlyPlayedItem[],
): ActivitySummary {
  const byHour: Record<number, number> = {};
  const byDay: Record<string, number> = {};
  const artistSet = new Set<string>();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let weekCount = 0;

  if (Array.isArray(recentlyPlayed)) {
    for (const item of recentlyPlayed) {
      if (!item || !item.playedAt) continue;
      const date = new Date(item.playedAt);
      if (isNaN(date.getTime())) continue;

      const hour = date.getHours();
      const dayKey = date.toISOString().split('T')[0];

      byHour[hour] = (byHour[hour] || 0) + 1;
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;

      if (date >= weekAgo) {
        weekCount++;
        if (item?.track?.artists && Array.isArray(item.track.artists)) {
          item.track.artists.forEach((a) => {
            if (a?.id) artistSet.add(a.id);
          });
        }
      }
    }
  }

  return {
    byHour,
    byDay,
    totalTracksThisWeek: weekCount,
    uniqueArtistsThisWeek: artistSet.size,
  };
}

// ============================================================
// Misc Helpers
// ============================================================

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function timeRangeLabel(range: string): string {
  switch (range) {
    case 'short_term': return 'Last 4 weeks';
    case 'medium_term': return 'Last 6 months';
    case 'long_term': return 'All time';
    default: return range;
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Generate a random state string for OAuth CSRF protection.
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
