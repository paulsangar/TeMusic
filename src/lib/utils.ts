// ============================================================
// General Utilities
// ============================================================

import type { SpotifyTrackRaw, SpotifyArtistRaw, SpotifyPlaylistRaw } from './spotify/types';
import type { SpotifyTrackItem, SpotifyArtistItem, SpotifyPlaylistItem, RecentlyPlayedItem, ActivitySummary } from '@/types';

// ============================================================
// Spotify Data Mappers (raw API → app types)
// ============================================================

export function mapTrack(raw: SpotifyTrackRaw): SpotifyTrackItem {
  return {
    id: raw.id,
    name: raw.name,
    uri: raw.uri,
    artists: raw.artists.map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: raw.album.id,
      name: raw.album.name,
      images: raw.album.images,
    },
    durationMs: raw.duration_ms,
    popularity: raw.popularity,
    previewUrl: raw.preview_url,
    externalUrl: raw.external_urls.spotify,
  };
}

export function mapArtist(raw: SpotifyArtistRaw): SpotifyArtistItem {
  return {
    id: raw.id,
    name: raw.name,
    genres: raw.genres,
    images: raw.images,
    popularity: raw.popularity,
    followers: raw.followers.total,
    externalUrl: raw.external_urls.spotify,
  };
}

export function mapPlaylist(raw: SpotifyPlaylistRaw): SpotifyPlaylistItem {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    images: raw.images,
    owner: {
      id: raw.owner.id,
      displayName: raw.owner.display_name || raw.owner.id,
    },
    trackCount: raw.tracks.total,
    isPublic: raw.public ?? false,
    isCollaborative: raw.collaborative,
    externalUrl: raw.external_urls.spotify,
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

  for (const item of recentlyPlayed) {
    const date = new Date(item.playedAt);
    const hour = date.getHours();
    const dayKey = date.toISOString().split('T')[0];

    byHour[hour] = (byHour[hour] || 0) + 1;
    byDay[dayKey] = (byDay[dayKey] || 0) + 1;

    if (date >= weekAgo) {
      weekCount++;
      item.track.artists.forEach((a) => artistSet.add(a.id));
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
