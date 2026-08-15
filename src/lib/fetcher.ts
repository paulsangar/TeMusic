// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
// Centralized SWR Fetcher
// Validates response.ok and json.error according to TeMusic API contract:
// { data: <payload | null>, error: <string | null>, status: <number> }
// ============================================================

export async function fetcher<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = json?.error || `HTTP ${res.status}: ${res.statusText || 'Fetch failed'}`;
    const retryAfterHeader = res.headers.get('retry-after');
    const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : null;
    throw new ApiError(errorMsg, res.status, Number.isFinite(retryAfter) ? retryAfter : null);
  }

  if (json && json.error) {
    throw new ApiError(json.error, json.status || res.status, null);
  }

  return (json ? json.data : null) as T;
}
