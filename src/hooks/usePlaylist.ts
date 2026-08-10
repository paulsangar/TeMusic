'use client';

import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import type { SpotifyPlaylistItem, SpotifyTrackItem, PlaylistAnalysis } from '@/types';

export function usePlaylists() {
  return useSWR<SpotifyPlaylistItem[]>('/api/lab/playlists', fetcher, {
    revalidateOnFocus: false,
  });
}

export function usePlaylistDetail(playlistId: string | null) {
  return useSWR<SpotifyPlaylistItem & { tracks: (SpotifyTrackItem & { addedAt: string })[] }>(
    playlistId ? `/api/lab/playlists/${playlistId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function usePlaylistAnalysis(playlistId: string | null) {
  return useSWR<PlaylistAnalysis>(
    playlistId ? `/api/lab/analyze/${playlistId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function usePlaylistActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPlaylist = useCallback(async (payload: {
    playlistId: string;
    removeDuplicates: boolean;
    removeUnpopular: boolean;
    popularityThreshold?: number;
    newName?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lab/clean-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clean playlist');
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThemedPlaylist = useCallback(async (payload: {
    name: string;
    description?: string;
    seedArtists?: string[];
    seedTracks?: string[];
    seedGenres?: string[];
    targetDurationMinutes?: number;
    isPublic?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lab/create-themed-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create playlist');
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cleanPlaylist, createThemedPlaylist, isLoading, error };
}
