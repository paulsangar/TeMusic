// ============================================================
// POST /api/lab/apply-cover
// Upload a custom cover image to a playlist.
// ============================================================

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { uploadPlaylistCover } from '@/lib/spotify/client';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { playlistId, imageBase64 } = body;

    if (!playlistId || !imageBase64) {
      return Response.json(
        { data: null, error: 'playlistId and imageBase64 are required', status: 400 },
        { status: 400 },
      );
    }

    // Check image size (max 256 KB when base64 encoded)
    const imageSizeBytes = Math.ceil(imageBase64.length * 0.75);
    if (imageSizeBytes > 256 * 1024) {
      return Response.json(
        { data: null, error: 'Image must be smaller than 256 KB', status: 400 },
        { status: 400 },
      );
    }

    await uploadPlaylistCover(auth.accessToken, playlistId, imageBase64);

    return Response.json({
      data: { success: true, playlistId },
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Apply cover error:', error);
    return Response.json(
      { data: null, error: 'Failed to apply playlist cover', status: 500 },
      { status: 500 },
    );
  }
}
