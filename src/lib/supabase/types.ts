// ============================================================
// Supabase Type Definitions (DB rows)
// ============================================================

export interface UserRow {
  id: string;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricsSnapshotRow {
  id: string;
  user_id: string;
  captured_at: string;
  time_range: string;
  sync_batch_id: string | null;
  top_tracks: unknown;        // JSONB
  top_artists: unknown;       // JSONB
  recently_played: unknown;   // JSONB
  activity_summary: unknown;  // JSONB
  ai_summary: string | null;
}

export interface PlaylistSnapshotRow {
  id: string;
  user_id: string;
  playlist_id: string;
  captured_at: string;
  name: string | null;
  description: string | null;
  track_count: number | null;
  tracks: unknown;            // JSONB
  is_public: boolean | null;
  owner_id: string | null;
}

export interface AlertsConfigRow {
  id: string;
  user_id: string;
  frequency: string;
  metrics_enabled: boolean;
  discovery_enabled: boolean;
  lab_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Database type map for Supabase generic typing
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRow, 'id'>>;
      };
      metrics_snapshots: {
        Row: MetricsSnapshotRow;
        Insert: Omit<MetricsSnapshotRow, 'id' | 'captured_at'>;
        Update: Partial<Omit<MetricsSnapshotRow, 'id'>>;
      };
      playlist_snapshots: {
        Row: PlaylistSnapshotRow;
        Insert: Omit<PlaylistSnapshotRow, 'id' | 'captured_at'>;
        Update: Partial<Omit<PlaylistSnapshotRow, 'id'>>;
      };
      alerts_config: {
        Row: AlertsConfigRow;
        Insert: Omit<AlertsConfigRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AlertsConfigRow, 'id'>>;
      };
    };
  };
}
