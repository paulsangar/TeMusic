'use client';

import React, { useState, use } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { usePlaylistDetail, usePlaylistAnalysis, usePlaylistActions } from '@/hooks/usePlaylist';

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: playlist, isLoading: loadingPlaylist, error: errorPlaylist, mutate: mutatePlaylist } = usePlaylistDetail(id);
  const { data: analysis, isLoading: loadingAnalysis } = usePlaylistAnalysis(id);
  const { cleanPlaylist, isLoading: actionLoading } = usePlaylistActions();
  const [cleanResult, setCleanResult] = useState<{ newPlaylistName: string; removedCount: number } | null>(null);

  const handleClean = async () => {
    const result = await cleanPlaylist({
      playlistId: id,
      removeDuplicates: true,
      removeUnpopular: false,
    });
    if (result) setCleanResult(result);
  };

  const isLoading = loadingPlaylist || loadingAnalysis;

  if (errorPlaylist) {
    return (
      <div>
        <Header title="Playlist Detail" module="lab" />
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Failed to load playlist details
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {errorPlaylist instanceof Error ? errorPlaylist.message : 'Could not fetch playlist from Spotify.'}
            </p>
            <Button variant="primary" size="md" onClick={() => mutatePlaylist()}>
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
        title={playlist?.name || 'Loading...'}
        subtitle={playlist ? `${playlist.trackCount} tracks · by ${playlist.owner.displayName}` : ''}
        module="lab"
      />

      {/* Analysis Cards */}
      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Duplicates</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: analysis.duplicateCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {analysis.duplicateCount}
            </div>
          </Card>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Popularity</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{analysis.averagePopularity}</div>
          </Card>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Unique Artists</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{Object.keys(analysis.genreDistribution).length}</div>
          </Card>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Top Year</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              {Object.entries(analysis.yearDistribution || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </div>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Button variant="primary" size="sm" onClick={handleClean} isLoading={actionLoading}>
          🧹 Clone & Clean (Remove Duplicates)
        </Button>
        {playlist?.externalUrl && (
          <a href={playlist.externalUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button variant="spotify" size="sm">
              Open in Spotify ↗
            </Button>
          </a>
        )}
      </div>

      {cleanResult && (
        <Card padding="md" variant="lab" style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--success)', fontWeight: 600 }}>
            ✅ Created &quot;{cleanResult.newPlaylistName}&quot; — removed {cleanResult.removedCount} duplicates
          </p>
        </Card>
      )}

      {/* Duplicates Warning */}
      {analysis && analysis.duplicates.length > 0 && (
        <Card padding="md" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--warning)' }}>
            ⚠️ Duplicate Tracks ({analysis.duplicateCount})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {analysis.duplicates.map((dup: { trackName: string; artistName: string; occurrences: number }, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <Badge variant="warning" size="sm">×{dup.occurrences}</Badge>
                <span style={{ color: 'var(--text-primary)' }}>{dup.trackName}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>by {dup.artistName}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Track List */}
      <Card padding="md">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Tracks</h3>
        {isLoading ? (
          <SkeletonList count={15} />
        ) : playlist?.tracks && playlist.tracks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '600px', overflowY: 'auto' }}>
            {playlist.tracks.map((track: { id: string; name: string; artists: { name: string }[]; album: { images: { url: string }[]; releaseYear?: string }; popularity: number; externalUrl: string }, i: number) => (
              <a
                key={`${track.id}-${i}`}
                href={track.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '28px', textAlign: 'center' }}>{i + 1}</span>
                {track.album.images[0] && (
                  <img src={track.album.images[track.album.images.length > 1 ? 1 : 0]?.url} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{track.artists.map((a: { name: string }) => a.name).join(', ')}</div>
                </div>
                {track.album.releaseYear && (
                  <Badge variant="lab" size="sm">{track.album.releaseYear}</Badge>
                )}
                <Badge variant="default" size="sm">{track.popularity}</Badge>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Esta playlist está vacía</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No pudimos encontrar canciones o la playlist original no tiene tracks.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
