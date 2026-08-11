import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { getFeaturedPlaylists } from '@/lib/spotify/client';
import { refreshAccessToken } from '@/lib/spotify/auth';
import { saveGlobalTrend } from '@/lib/supabase/queries';
import { updateUserTokens } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  // Simple auth to prevent abuse
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabase();

  try {
    // 1. Get a user who has a token we can use
    const { data: users, error } = await db
      .from('users')
      .select('*')
      .not('refresh_token', 'is', null)
      .limit(1);

    if (error || !users || users.length === 0) {
      throw new Error('No users available to fetch trends on behalf of.');
    }

    const user = users[0];
    let accessToken = user.access_token;

    // Refresh if expired
    const tokenExpiry = user.token_expires_at ? new Date(user.token_expires_at) : new Date(0);
    if (Date.now() + 5 * 60 * 1000 >= tokenExpiry.getTime()) {
      const newTokens = await refreshAccessToken(user.refresh_token);
      await updateUserTokens(user.id, newTokens);
      accessToken = newTokens.access_token;
    }

    // 2. Fetch featured playlists globally
    const featured = await getFeaturedPlaylists(accessToken, 50);

    // 3. Save to global_trends table
    await saveGlobalTrend({
      category: 'featured-playlists',
      area: 'global',
      trendData: featured,
    });

    return Response.json({
      success: true,
      message: `Saved ${featured.playlists.items.length} featured playlists to global trends.`,
    });
  } catch (error) {
    console.error('Failed to sync global trends:', error);
    return Response.json({ error: 'Failed to sync trends' }, { status: 500 });
  }
}
