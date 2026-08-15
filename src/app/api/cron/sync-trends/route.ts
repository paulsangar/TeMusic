import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ data: null, error: 'Unauthorized', status: 401 }, { status: 401 });
  }

  return Response.json(
    { data: null, error: 'Global featured playlists are unavailable with the current Spotify API.', status: 410 },
    { status: 410 },
  );
}
