import { authenticateRequest } from '@/lib/auth-middleware';

export async function POST() {
  const { auth, errorResponse } = await authenticateRequest();
  if (!auth) return errorResponse;

  return Response.json(
    { data: null, error: 'Spotify Recommendations is unavailable in Development Mode.', status: 501 },
    { status: 501 },
  );
}
