// ============================================================
// GET /api/discovery/highlights
// Combined recommendations (Phase 2: will include AI).
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getGlobalTrends } from '@/lib/supabase/queries';
import type { DiscoveryHighlight } from '@/types';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();
  
  const trends = await getGlobalTrends('featured-playlists', 'global', 1);
  const featured = trends.length > 0 ? trends[0].data.playlists.items : [];

  const highlights: DiscoveryHighlight[] = [];

  if (featured.length > 0) {
    highlights.push({
      title: '🌍 Global Trends',
      description: 'Popular featured playlists around the world.',
      type: 'trending',
      items: featured.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.images?.[0]?.url,
        url: p.external_urls?.spotify,
      })),
      source: 'spotify',
    });
  }

  highlights.push({
    title: '🤖 AI-Powered Highlights Coming Soon',
    description: 'In a future update, TeMusc will use AI to generate personalized music recommendations, trend analysis, and discovery insights based on your listening patterns.',
    type: 'recommendation',
    items: [],
    source: 'gemini',
  });

  return Response.json({
    data: highlights,
    error: null,
    status: 200,
  });
}
