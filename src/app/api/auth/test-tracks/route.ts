import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { getAllUserPlaylists } from '@/lib/spotify/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { data: users, error } = await supabase.from('users').select('*').limit(1);
  if (error || !users || users.length === 0) {
    return Response.json({ error: 'No user' }, { status: 400 });
  }

  const user = users[0];
  try {
    const playlists = await getAllUserPlaylists(user.access_token);
    
    // just return the raw tracks object of the first 3 playlists
    const sample = playlists.slice(0, 3).map(p => ({
      name: p.name,
      tracks: p.tracks,
      trackCount: p.tracks?.total || 0
    }));

    return Response.json({ sample });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
