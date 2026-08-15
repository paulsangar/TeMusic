// ============================================================
// GET /api/discovery/highlights
// Combined recommendations (Phase 2: will include AI).
// ============================================================

import { authenticateRequest } from '@/lib/auth-middleware';
import type { DiscoveryHighlight } from '@/types';

export async function GET() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;
  
  const highlights: DiscoveryHighlight[] = [];

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
