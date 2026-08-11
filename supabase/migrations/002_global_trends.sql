-- ============================================================
-- TeMusc — Global Trends Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS global_trends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at     TIMESTAMPTZ DEFAULT NOW(),
  category        TEXT NOT NULL,
  area            TEXT NOT NULL,
  data            JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_global_trends_category ON global_trends(category);
CREATE INDEX IF NOT EXISTS idx_global_trends_area ON global_trends(area);
CREATE INDEX IF NOT EXISTS idx_global_trends_captured_at ON global_trends(captured_at DESC);

ALTER TABLE global_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_global_trends" ON global_trends FOR ALL USING (true);
