// ============================================================
// GET /api/auth/me
// Returns current authenticated user profile.
// ============================================================

import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  const { user } = auth;

  return Response.json({
    data: {
      id: user.id,
      spotifyId: user.spotify_id,
      displayName: user.display_name,
      email: user.email,
      country: user.country,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    },
    error: null,
    status: 200,
  });
}
