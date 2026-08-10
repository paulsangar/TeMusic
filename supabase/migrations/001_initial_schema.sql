-- ============================================================
-- TeMusc — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Users table: stores Spotify auth data and profile info
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id      TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  email           TEXT,
  country         TEXT,
  avatar_url      TEXT,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics snapshots: periodic captures of listening data
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  captured_at     TIMESTAMPTZ DEFAULT NOW(),
  time_range      TEXT NOT NULL,
  top_tracks      JSONB NOT NULL,
  top_artists     JSONB NOT NULL,
  recently_played JSONB,
  activity_summary JSONB,
  ai_summary      TEXT
);

-- Playlist snapshots: historical captures of playlist state
CREATE TABLE IF NOT EXISTS playlist_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  playlist_id     TEXT NOT NULL,
  captured_at     TIMESTAMPTZ DEFAULT NOW(),
  name            TEXT,
  description     TEXT,
  track_count     INT,
  tracks          JSONB NOT NULL,
  is_public       BOOLEAN,
  owner_id        TEXT
);

-- Alert configuration per user
CREATE TABLE IF NOT EXISTS alerts_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  frequency       TEXT DEFAULT 'weekly',
  metrics_enabled BOOLEAN DEFAULT TRUE,
  discovery_enabled BOOLEAN DEFAULT TRUE,
  lab_enabled     BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_user_id ON metrics_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_captured_at ON metrics_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_snapshots_user_id ON playlist_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_snapshots_playlist_id ON playlist_snapshots(playlist_id);

-- Enable RLS (policies managed at application level with service role key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_config ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so no policies needed for API routes
-- These permissive policies are for reference only
CREATE POLICY "service_role_all_users" ON users FOR ALL USING (true);
CREATE POLICY "service_role_all_metrics" ON metrics_snapshots FOR ALL USING (true);
CREATE POLICY "service_role_all_playlists" ON playlist_snapshots FOR ALL USING (true);
CREATE POLICY "service_role_all_alerts" ON alerts_config FOR ALL USING (true);
