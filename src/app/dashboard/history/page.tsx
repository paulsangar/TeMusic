'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useMetricsHistory } from '@/hooks/useSpotifyData';
import type { SpotifyTrackItem, SpotifyArtistItem } from '@/types';

export default function HistoryPage() {
  const { data: history, isLoading, error, mutate } = useMetricsHistory();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  if (error) {
    return (
      <div>
        <Header title="Snapshot History" module="os" />
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Failed to load snapshot history
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {error instanceof Error ? error.message : 'Could not fetch your saved snapshots.'}
            </p>
            <Button variant="primary" size="md" onClick={() => mutate()}>
              🔄 Retry Loading
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            {history.map((snapshot) => {
              const isSelected = selectedSnapshotId === snapshot.id;
              const tracks = Array.isArray(snapshot.top_tracks) ? (snapshot.top_tracks as SpotifyTrackItem[]) : [];
              const artists = Array.isArray(snapshot.top_artists) ? (snapshot.top_artists as SpotifyArtistItem[]) : [];

              return (
                <div
                  key={snapshot.id}
                  className="glass-light"
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all var(--transition-fast)',
                    border: isSelected ? '1px solid var(--accent-os)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedSnapshotId(isSelected ? null : snapshot.id)}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        📸 Snapshot — {new Date(snapshot.captured_at).toLocaleDateString(undefined, {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge variant="os" size="sm">{tracks.length} tracks</Badge>
                      <Badge variant="discovery" size="sm">{artists.length} artists</Badge>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {isSelected ? '▲ Hide Preview' : '▼ Preview'}
                      </span>
                    </div>
                  </div>

                  {/* Snapshot Preview Detail */}
                  {isSelected && (
                    <div
                      className="animate-fade-in"
                      style={{
                        marginTop: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-os)', marginBottom: '8px' }}>
                          🎵 Top Tracks Captured ({tracks.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {tracks.slice(0, 5).map((t, idx) => (
                            <div key={idx} style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-tertiary)', width: '16px' }}>{idx + 1}.</span>
                              <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.name}
                              </span>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
                                by {t.artists?.map(a => a.name).join(', ') || 'Unknown'}
                              </span>
                            </div>
                          ))}
                          {tracks.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No tracks saved</span>}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-discovery)', marginBottom: '8px' }}>
                          🎤 Top Artists Captured ({artists.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {artists.slice(0, 5).map((a, idx) => (
                            <div key={idx} style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-tertiary)', width: '16px' }}>{idx + 1}.</span>
                              <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.name}
                              </span>
                            </div>
                          ))}
                          {artists.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No artists saved</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
