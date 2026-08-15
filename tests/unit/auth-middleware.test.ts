import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@/lib/auth-middleware';
import type { SpotifyTokens } from '@/lib/spotify/types';

const mocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn(),
  updateUserTokens: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getUserById: vi.fn(),
  updateUserTokens: mocks.updateUserTokens,
}));

vi.mock('@/lib/spotify/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/spotify/auth')>();
  return {
    ...actual,
    refreshAccessToken: mocks.refreshAccessToken,
  };
});

import { withSpotifyRetry } from '@/lib/auth-middleware';
import { SpotifyApiError } from '@/lib/spotify/client';

function authenticatedUser(): AuthenticatedUser {
  return {
    user: {
      id: 'internal-user-id',
      spotify_id: 'spotify-user-id',
      display_name: 'Test User',
      email: null,
      country: null,
      avatar_url: null,
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      token_expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    accessToken: 'expired-token',
  };
}

describe('withSpotifyRetry', () => {
  beforeEach(() => {
    mocks.refreshAccessToken.mockReset();
    mocks.updateUserTokens.mockReset();
  });

  it('refreshes once and retries an unexpected Spotify 401', async () => {
    const auth = authenticatedUser();
    const refreshedTokens: SpotifyTokens = {
      access_token: 'fresh-token',
      refresh_token: 'fresh-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'playlist-read-private',
    };
    mocks.refreshAccessToken.mockResolvedValue(refreshedTokens);
    mocks.updateUserTokens.mockResolvedValue(undefined);
    const operation = vi.fn()
      .mockRejectedValueOnce(new SpotifyApiError(401, 'Unauthorized'))
      .mockResolvedValueOnce('success');

    await expect(withSpotifyRetry(auth, operation)).resolves.toBe('success');

    expect(operation).toHaveBeenNthCalledWith(1, 'expired-token');
    expect(operation).toHaveBeenNthCalledWith(2, 'fresh-token');
    expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.updateUserTokens).toHaveBeenCalledTimes(1);
    expect(auth.accessToken).toBe('fresh-token');
  });

  it('stops after a second 401 without attempting a third call', async () => {
    const auth = authenticatedUser();
    mocks.refreshAccessToken.mockResolvedValue({
      access_token: 'fresh-token',
      refresh_token: 'fresh-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'playlist-read-private',
    } satisfies SpotifyTokens);
    mocks.updateUserTokens.mockResolvedValue(undefined);
    const operation = vi.fn().mockRejectedValue(new SpotifyApiError(401, 'Unauthorized'));

    await expect(withSpotifyRetry(auth, operation)).rejects.toMatchObject({ status: 401 });
    expect(operation).toHaveBeenCalledTimes(2);
    expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.updateUserTokens).toHaveBeenCalledTimes(1);
  });

  it.each([403, 429, 500])('does not refresh a Spotify %i response', async (status) => {
    const auth = authenticatedUser();
    const operation = vi.fn().mockRejectedValue(new SpotifyApiError(status, 'Failure'));

    await expect(withSpotifyRetry(auth, operation)).rejects.toMatchObject({ status });
    expect(operation).toHaveBeenCalledTimes(1);
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled();
    expect(mocks.updateUserTokens).not.toHaveBeenCalled();
  });
});
