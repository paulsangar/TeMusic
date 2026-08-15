import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@/lib/auth-middleware';
import type { SpotifyPlaylistRaw, SpotifyTrackRaw } from '@/lib/spotify/types';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  withSpotifyRetry: vi.fn(),
  getPlaylist: vi.fn(),
  getPlaylistTracks: vi.fn(),
  createPlaylist: vi.fn(),
  addTracksToPlaylist: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
  withSpotifyRetry: mocks.withSpotifyRetry,
}));

vi.mock('@/lib/spotify/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/spotify/client')>();
  return {
    ...actual,
    getPlaylist: mocks.getPlaylist,
    getPlaylistTracks: mocks.getPlaylistTracks,
    createPlaylist: mocks.createPlaylist,
    addTracksToPlaylist: mocks.addTracksToPlaylist,
  };
});

import { POST } from '@/app/api/lab/clean-playlist/route';
import { SpotifyApiError } from '@/lib/spotify/client';

function makeTrack(index: number): SpotifyTrackRaw {
  return {
    id: `track-${index}`,
    name: `Track ${index}`,
    uri: `spotify:track:${index}`,
    artists: [{ id: `artist-${index}`, name: `Artist ${index}`, external_urls: { spotify: '' } }],
    album: { id: `album-${index}`, name: `Album ${index}`, images: [], release_date: '2026' },
    duration_ms: 180_000,
    preview_url: null,
    external_urls: { spotify: '' },
  };
}

function playlist(id: string, name: string): SpotifyPlaylistRaw {
  return {
    id,
    name,
    description: '',
    images: [],
    owner: { id: 'owner', display_name: 'Owner' },
    public: false,
    collaborative: false,
    external_urls: { spotify: '' },
    snapshot_id: 'snapshot',
  };
}

function cleanRequest(): Request {
  return new Request('http://localhost/api/lab/clean-playlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playlistId: 'source-playlist',
      removeDuplicates: true,
      removeUnpopular: false,
    }),
  });
}

describe('POST /api/lab/clean-playlist', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const auth = {
      user: {
        id: 'internal-user-id',
        refresh_token: 'refresh-token',
      },
      accessToken: 'test-token',
    } as AuthenticatedUser;
    mocks.authenticateRequest.mockResolvedValue({ auth, errorResponse: null });
    mocks.withSpotifyRetry.mockImplementation((currentAuth: AuthenticatedUser, operation: (token: string) => unknown) => (
      operation(currentAuth.accessToken)
    ));
    mocks.getPlaylist.mockResolvedValue(playlist('source-playlist', 'Source'));
    mocks.createPlaylist.mockResolvedValue(playlist('new-playlist', 'TeMusc LAB – Source'));
    mocks.addTracksToPlaylist.mockResolvedValue(undefined);
  });

  it('deduplicates across the complete source and mutates in 100-track batches', async () => {
    const sourceTracks = Array.from({ length: 205 }, (_, index) => makeTrack(index));
    sourceTracks[150] = sourceTracks[2];
    mocks.getPlaylistTracks.mockResolvedValue(sourceTracks.map((item) => ({
      added_at: '2026-08-15T00:00:00.000Z',
      item,
    })));

    const response = await POST(cleanRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.error).toBeNull();
    expect(body.data).toMatchObject({
      originalTrackCount: 205,
      cleanedTrackCount: 204,
      removedCount: 1,
    });
    expect(mocks.createPlaylist).toHaveBeenCalledTimes(1);
    expect(mocks.addTracksToPlaylist).toHaveBeenCalledTimes(3);
    const batches = mocks.addTracksToPlaylist.mock.calls.map(([, , uris]) => uris as string[]);
    expect(batches.map((batch) => batch.length)).toEqual([100, 100, 4]);
    expect(batches.flat()).toEqual(
      sourceTracks.filter((track, index, items) => (
        items.findIndex((candidate) => candidate.uri === track.uri) === index
      )).map((track) => track.uri),
    );
  });

  it('does not create a playlist when a complete source read fails', async () => {
    mocks.getPlaylistTracks.mockRejectedValue(new Error('page 2 failed'));

    const response = await POST(cleanRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ data: null, error: 'Failed to clean playlist', status: 500 });
    expect(mocks.createPlaylist).not.toHaveBeenCalled();
    expect(mocks.addTracksToPlaylist).not.toHaveBeenCalled();
  });

  it('retries only the rejected second batch after a Spotify 401', async () => {
    const sourceTracks = Array.from({ length: 205 }, (_, index) => makeTrack(index));
    mocks.getPlaylistTracks.mockResolvedValue(sourceTracks.map((item) => ({
      added_at: '2026-08-15T00:00:00.000Z',
      item,
    })));
    mocks.withSpotifyRetry.mockImplementation(async (
      currentAuth: AuthenticatedUser,
      operation: (token: string) => Promise<unknown>,
    ) => {
      try {
        return await operation(currentAuth.accessToken);
      } catch (error) {
        if (!(error instanceof SpotifyApiError) || error.status !== 401) throw error;
        currentAuth.accessToken = 'fresh-token';
        return operation(currentAuth.accessToken);
      }
    });
    let rejectedSecondBatch = false;
    mocks.addTracksToPlaylist.mockImplementation((token: string, _playlistId: string, uris: string[]) => {
      if (uris[0] === 'spotify:track:100' && token === 'test-token' && !rejectedSecondBatch) {
        rejectedSecondBatch = true;
        return Promise.reject(new SpotifyApiError(401, 'Unauthorized'));
      }
      return Promise.resolve();
    });

    const response = await POST(cleanRequest() as never);

    expect(response.status).toBe(201);
    expect(mocks.addTracksToPlaylist).toHaveBeenCalledTimes(4);
    const attemptedFirstUris = mocks.addTracksToPlaylist.mock.calls.map(([, , uris]) => (uris as string[])[0]);
    expect(attemptedFirstUris).toEqual([
      'spotify:track:0',
      'spotify:track:100',
      'spotify:track:100',
      'spotify:track:200',
    ]);
    expect(mocks.addTracksToPlaylist.mock.calls[0][0]).toBe('test-token');
    expect(mocks.addTracksToPlaylist.mock.calls[1][0]).toBe('test-token');
    expect(mocks.addTracksToPlaylist.mock.calls[2][0]).toBe('fresh-token');
    expect(mocks.addTracksToPlaylist.mock.calls[3][0]).toBe('fresh-token');
  });

  it('does not report success or attempt a third batch after a second-batch 500', async () => {
    const sourceTracks = Array.from({ length: 205 }, (_, index) => makeTrack(index));
    mocks.getPlaylistTracks.mockResolvedValue(sourceTracks.map((item) => ({
      added_at: '2026-08-15T00:00:00.000Z',
      item,
    })));
    mocks.addTracksToPlaylist.mockImplementation((_token: string, _playlistId: string, uris: string[]) => {
      if (uris[0] === 'spotify:track:100') {
        return Promise.reject(new SpotifyApiError(500, 'Server error'));
      }
      return Promise.resolve();
    });

    const response = await POST(cleanRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ data: null, error: 'Failed to clean playlist', status: 502 });
    expect(mocks.createPlaylist).toHaveBeenCalledTimes(1);
    expect(mocks.addTracksToPlaylist).toHaveBeenCalledTimes(2);
    expect(mocks.addTracksToPlaylist.mock.calls.map(([, , uris]) => (uris as string[])[0])).toEqual([
      'spotify:track:0',
      'spotify:track:100',
    ]);
  });
});
