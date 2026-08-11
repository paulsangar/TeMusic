import { NextRequest } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-middleware';
import { getRecommendations } from '@/lib/spotify/client';
import { mapTrack } from '@/lib/utils';
import type { RecommendationSeeds } from '@/lib/spotify/types';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const seeds: RecommendationSeeds = {
      seedGenres: body.seedGenres || [],
      seedArtists: body.seedArtists || [],
      seedTracks: body.seedTracks || [],
      targetDanceability: body.danceability,
      targetEnergy: body.energy,
      targetValence: body.valence,
      targetTempo: body.tempo,
      limit: body.limit || 20,
    };

    const tracks = await getRecommendations(auth.accessToken, seeds);

    return Response.json({
      data: tracks.map(mapTrack),
      error: null,
      status: 200,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return Response.json(
      { data: null, error: 'Failed to fetch recommendations', status: 500 },
      { status: 500 },
    );
  }
}
