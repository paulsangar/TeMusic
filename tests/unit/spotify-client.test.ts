import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SpotifyApiError,
  addTracksToPlaylist,
  getPlaylistTracks,
  getUserProfile,
  spotifyErrorResponse,
  uploadPlaylistCover,
} from '@/lib/spotify/client';

function paginatedResponse(items: unknown[], next: string | null): Response {
  return Response.json({
    items,
    total: 205,
    limit: 100,
    offset: 0,
    next,
    previous: null,
  });
}

describe('Spotify API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { upstreamStatus: 401, expectedStatus: 401 },
    { upstreamStatus: 403, expectedStatus: 403 },
    { upstreamStatus: 429, expectedStatus: 429 },
    { upstreamStatus: 500, expectedStatus: 502 },
  ])('preserves the $upstreamStatus failure contract', async ({ upstreamStatus, expectedStatus }) => {
    const sensitiveUpstreamBody = 'access_token=must-never-be-exposed';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      sensitiveUpstreamBody,
      {
        status: upstreamStatus,
        statusText: 'Upstream error',
        headers: upstreamStatus === 429 ? { 'Retry-After': '17' } : undefined,
      },
    )));

    let thrown: unknown;
    try {
      await getUserProfile('test-token');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(SpotifyApiError);
    expect(thrown).toMatchObject({
      status: upstreamStatus,
      retryAfter: upstreamStatus === 429 ? 17 : null,
    });
    expect(String(thrown)).not.toContain(sensitiveUpstreamBody);

    const response = spotifyErrorResponse(thrown, 'Spotify request failed');
    const body = await response.json();
    expect(response.status).toBe(expectedStatus);
    expect(body).toEqual({
      data: null,
      error: expect.any(String),
      status: expectedStatus,
    });
    expect(JSON.stringify(body)).not.toContain(sensitiveUpstreamBody);
    expect(response.headers.get('Retry-After')).toBe(upstreamStatus === 429 ? '17' : null);
  });

  it('loads all playlist pages without omitting items', async () => {
    const pages = [
      Array.from({ length: 100 }, (_, index) => ({ item: { id: `track-${index}` } })),
      Array.from({ length: 100 }, (_, index) => ({ item: { id: `track-${index + 100}` } })),
      Array.from({ length: 5 }, (_, index) => ({ item: { id: `track-${index + 200}` } })),
    ];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(paginatedResponse(pages[0], 'https://api.spotify.com/v1/next-page-2'))
      .mockResolvedValueOnce(paginatedResponse(pages[1], 'https://api.spotify.com/v1/next-page-3'))
      .mockResolvedValueOnce(paginatedResponse(pages[2], null));
    vi.stubGlobal('fetch', fetchMock);

    const tracks = await getPlaylistTracks('test-token', 'playlist-id');

    expect(tracks).toHaveLength(205);
    expect(tracks.map((entry) => entry.item?.id)).toEqual(
      Array.from({ length: 205 }, (_, index) => `track-${index}`),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([1, 2])('fails closed when playlist page %i fails', async (failingPage) => {
    const responses = [
      paginatedResponse([{ item: { id: 'first-page-track' } }], 'https://api.spotify.com/v1/next-page'),
      new Response('upstream failure', { status: 500, statusText: 'Server error' }),
    ];
    const fetchMock = vi.fn();
    for (let page = 1; page <= failingPage; page += 1) {
      fetchMock.mockResolvedValueOnce(page === failingPage ? responses[1] : responses[0]);
    }
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPlaylistTracks('test-token', 'playlist-id')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(failingPage);
  });

  it('adds 205 track URIs in exact 100/100/5 batches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const uris = Array.from({ length: 205 }, (_, index) => `spotify:track:${index}`);

    await addTracksToPlaylist('test-token', 'playlist-id', uris);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const batches = fetchMock.mock.calls.map(([, options]) => (
      JSON.parse(String((options as RequestInit).body)) as { uris: string[] }
    ).uris);
    expect(batches.map((batch) => batch.length)).toEqual([100, 100, 5]);
    expect(batches.flat()).toEqual(uris);
  });

  it('preserves Retry-After when a cover upload is rate limited', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '23' },
    })));

    await expect(uploadPlaylistCover('test-token', 'playlist-id', 'base64-image')).rejects.toMatchObject({
      status: 429,
      retryAfter: 23,
    });
  });

  it('accepts Spotify 202 cover upload success without a JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {
      status: 202,
      statusText: 'Accepted',
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadPlaylistCover('test-token', 'playlist-id', 'base64-image')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/playlists/playlist-id/images',
      expect.objectContaining({ method: 'PUT', body: 'base64-image' }),
    );
  });
});
