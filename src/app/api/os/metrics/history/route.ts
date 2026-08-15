// ============================================================
// GET /api/os/metrics/history
// List past metric snapshots.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { getMetricsHistory } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);

  try {
    const history = await getMetricsHistory(auth.user.id, limit);
    return Response.json({
      data: history,
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Metrics history error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch metrics history', status: 500 },
      { status: 500 },
    );
  }
}
