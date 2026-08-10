// ============================================================
// Supabase Query Helpers
// Reusable functions for reading/writing TeMusc data.
// ============================================================

import { getSupabase } from './client';
import type { UserRow, MetricsSnapshotRow, PlaylistSnapshotRow, AlertsConfigRow } from './types';
import type { SpotifyTokens } from '../spotify/types';

// ============================================================
// Users
// ============================================================

export async function upsertUser(data: {
  spotifyId: string;
  displayName: string;
  email: string;
  country: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}): Promise<UserRow> {
  const db = getSupabase();
  const { data: user, error } = await db
    .from('users')
    .upsert(
      {
        spotify_id: data.spotifyId,
        display_name: data.displayName,
        email: data.email,
        country: data.country,
        avatar_url: data.avatarUrl,
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        token_expires_at: data.tokenExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'spotify_id' },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert user: ${error.message}`);
  return user as UserRow;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const db = getSupabase();
  const { data, error } = await db.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data as UserRow;
}

export async function getUserBySpotifyId(spotifyId: string): Promise<UserRow | null> {
  const db = getSupabase();
  const { data, error } = await db.from('users').select('*').eq('spotify_id', spotifyId).single();
  if (error) return null;
  return data as UserRow;
}

export async function updateUserTokens(
  userId: string,
  tokens: SpotifyTokens,
): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from('users')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update tokens: ${error.message}`);
}

// ============================================================
// Metrics Snapshots
// ============================================================

export async function saveMetricsSnapshot(data: {
  userId: string;
  timeRange: string;
  topTracks: unknown;
  topArtists: unknown;
  recentlyPlayed: unknown;
  activitySummary: unknown;
  aiSummary?: string;
}): Promise<MetricsSnapshotRow> {
  const db = getSupabase();
  const { data: snapshot, error } = await db
    .from('metrics_snapshots')
    .insert({
      user_id: data.userId,
      time_range: data.timeRange,
      top_tracks: data.topTracks,
      top_artists: data.topArtists,
      recently_played: data.recentlyPlayed,
      activity_summary: data.activitySummary,
      ai_summary: data.aiSummary || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save snapshot: ${error.message}`);
  return snapshot as MetricsSnapshotRow;
}

export async function getMetricsHistory(
  userId: string,
  limit: number = 20,
): Promise<MetricsSnapshotRow[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('captured_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get metrics history: ${error.message}`);
  return (data || []) as MetricsSnapshotRow[];
}

// ============================================================
// Playlist Snapshots
// ============================================================

export async function savePlaylistSnapshot(data: {
  userId: string;
  playlistId: string;
  name: string;
  description?: string;
  trackCount: number;
  tracks: unknown;
  isPublic: boolean;
  ownerId: string;
}): Promise<PlaylistSnapshotRow> {
  const db = getSupabase();
  const { data: snapshot, error } = await db
    .from('playlist_snapshots')
    .insert({
      user_id: data.userId,
      playlist_id: data.playlistId,
      name: data.name,
      description: data.description || null,
      track_count: data.trackCount,
      tracks: data.tracks,
      is_public: data.isPublic,
      owner_id: data.ownerId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save playlist snapshot: ${error.message}`);
  return snapshot as PlaylistSnapshotRow;
}

export async function getPlaylistSnapshots(
  userId: string,
  playlistId: string,
  limit: number = 10,
): Promise<PlaylistSnapshotRow[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from('playlist_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('playlist_id', playlistId)
    .order('captured_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get playlist snapshots: ${error.message}`);
  return (data || []) as PlaylistSnapshotRow[];
}

// ============================================================
// Alerts Config
// ============================================================

export async function getAlertsConfig(userId: string): Promise<AlertsConfigRow | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('alerts_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as AlertsConfigRow;
}

export async function upsertAlertsConfig(data: {
  userId: string;
  frequency?: string;
  metricsEnabled?: boolean;
  discoveryEnabled?: boolean;
  labEnabled?: boolean;
}): Promise<AlertsConfigRow> {
  const db = getSupabase();
  const { data: config, error } = await db
    .from('alerts_config')
    .upsert(
      {
        user_id: data.userId,
        frequency: data.frequency || 'weekly',
        metrics_enabled: data.metricsEnabled ?? true,
        discovery_enabled: data.discoveryEnabled ?? true,
        lab_enabled: data.labEnabled ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert alerts config: ${error.message}`);
  return config as AlertsConfigRow;
}
