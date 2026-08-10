// ============================================================
// GET /api/discovery/highlights
// Combined recommendations (Phase 2: will include AI).
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import type { DiscoveryHighlight } from '@/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  // Phase 2: This will combine Spotify data with Perplexity/Gemini analysis.
  // For now, return placeholder highlights.
  const highlights: DiscoveryHighlight[] = [
    {
      title: '🤖 AI-Powered Highlights Coming Soon',
      description: 'In a future update, TeMusc will use AI to generate personalized music recommendations, trend analysis, and discovery insights based on your listening patterns.',
      type: 'recommendation',
      items: [],
      source: 'gemini',
    },
    {
      title: '🔍 Web-Enriched Discovery Coming Soon',
      description: 'TeMusc will use Perplexity AI to search the web for relevant playlists, music articles, and emerging scenes that match your taste.',
      type: 'trending',
      items: [],
      source: 'perplexity',
    },
  ];

  return Response.json({
    data: highlights,
    error: null,
    status: 200,
  });
}
