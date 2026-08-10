'use client';

import useSWR from 'swr';
import type { MetricsOverview, SpotifyTrackItem, SpotifyArtistItem, RecentlyPlayedItem } from '@/types';
import type { TimeRange } from '@/lib/spotify/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function useMetricsOverview() {
  return useSWR<MetricsOverview>('/api/os/metrics/overview', fetcher, {
    revalidateOnFocus: false,
  });
}

export function useTopTracks(timeRange: TimeRange = 'medium_term') {
  return useSWR<SpotifyTrackItem[]>(
    `/api/os/metrics/top-tracks?time_range=${timeRange}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useTopArtists(timeRange: TimeRange = 'medium_term') {
  return useSWR<SpotifyArtistItem[]>(
    `/api/os/metrics/top-artists?time_range=${timeRange}`,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useRecentlyPlayed() {
  return useSWR<RecentlyPlayedItem[]>(
    '/api/os/metrics/recent',
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useMetricsHistory() {
  return useSWR('/api/os/metrics/history', fetcher, {
    revalidateOnFocus: false,
  });
}
