'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useMetricsHistory } from '@/hooks/useSpotifyData';

export default function HistoryPage() {
  const { data: history, isLoading } = useMetricsHistory();

  return (
    <div>
      <Header
        title="Snapshot History"
        subtitle="Your saved metrics snapshots over time"
        module="os"
      />

      <Card padding="lg">
        {isLoading ? (
          <SkeletonList count={8} />
        ) : history && history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((snapshot: { id: string; captured_at: string; time_range: string; top_tracks: { length?: number }[]; top_artists: { length?: number }[] }) => (
              <div
                key={snapshot.id}
                className="glass-light"
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    Snapshot — {new Date(snapshot.captured_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Time range: {snapshot.time_range}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant="os" size="sm">{Array.isArray(snapshot.top_tracks) ? snapshot.top_tracks.length : 0} tracks</Badge>
                  <Badge variant="discovery" size="sm">{Array.isArray(snapshot.top_artists) ? snapshot.top_artists.length : 0} artists</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No snapshots yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Click &quot;Save Snapshot&quot; on your dashboard to capture your current metrics.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
