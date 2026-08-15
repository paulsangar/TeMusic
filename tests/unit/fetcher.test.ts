import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetcher } from '@/lib/fetcher';

describe('frontend fetcher contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([401, 403, 500])('preserves HTTP status %i from a contractual error', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { data: null, error: `Failure ${status}`, status },
      { status },
    )));

    await expect(fetcher('/api/test')).rejects.toMatchObject({
      name: 'ApiError',
      message: `Failure ${status}`,
      status,
      retryAfter: null,
    });
  });

  it('preserves Retry-After on a 429 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { data: null, error: 'Wait before retrying', status: 429 },
      { status: 429, headers: { 'Retry-After': '31' } },
    )));

    let thrown: unknown;
    try {
      await fetcher('/api/test');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiError);
    expect(thrown).toMatchObject({ status: 429, retryAfter: 31 });
  });

  it('returns only the data field on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { data: { ready: true }, error: null, status: 200 },
      { status: 200 },
    )));

    await expect(fetcher<{ ready: boolean }>('/api/test')).resolves.toEqual({ ready: true });
  });
});
