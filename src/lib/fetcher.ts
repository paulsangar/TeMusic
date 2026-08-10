// ============================================================
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
    throw new Error(errorMsg);
  }

  if (json && json.error) {
    throw new Error(json.error);
  }

  return (json ? json.data : null) as T;
}
