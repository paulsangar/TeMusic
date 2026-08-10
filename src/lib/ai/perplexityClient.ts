// ============================================================
// Perplexity Client — STUB (Phase 2)
// ============================================================
// This module will be replaced with real Perplexity API calls in Phase 2.
// For now, it returns mock data.

export interface DiscoveryContext {
  title: string;
  description: string;
  url?: string;
  source: string;
}

/**
 * Enrich discovery with web context.
 * Phase 2: Will query Perplexity Sonar for relevant playlists, scenes, genres.
 */
export async function enrichDiscoveryWithWebContext(
  _userProfile: Record<string, unknown>,
  _metrics: Record<string, unknown>,
): Promise<DiscoveryContext[]> {
  return [
    {
      title: '🔍 Web-enriched discovery coming soon',
      description: 'In a future update, TeMusc will use AI to find playlists, articles, and music scenes relevant to your taste.',
      source: 'temusc-stub',
    },
  ];
}

/**
 * Suggest public playlists by mood.
 * Phase 2: Will query Perplexity for mood-based playlist suggestions.
 */
export async function suggestPublicPlaylistsByMood(
  _mood: string,
  _genres: string[],
): Promise<DiscoveryContext[]> {
  return [
    {
      title: '🎶 Mood-based suggestions coming soon',
      description: 'AI-powered mood-based playlist suggestions will be available in a future update.',
      source: 'temusc-stub',
    },
  ];
}
