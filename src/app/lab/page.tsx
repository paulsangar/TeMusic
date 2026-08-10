'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { usePlaylists } from '@/hooks/usePlaylist';
import type { SpotifyPlaylistItem } from '@/types';

function PlaylistRow({ playlist }: { playlist: SpotifyPlaylistItem }) {
  return (
    <Link
      href={`/lab/playlist/${playlist.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        transition: 'background var(--transition-fast)',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {playlist.images[0] ? (
        <img
          src={playlist.images[0].url}
          alt={playlist.name}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--accent-lab), rgba(245,158,11,0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          🎵
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {playlist.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {playlist.owner.displayName} · {playlist.trackCount} tracks
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {playlist.isPublic && <Badge variant="success" size="sm">Public</Badge>}
        {playlist.isCollaborative && <Badge variant="warning" size="sm">Collab</Badge>}
        <Badge variant="lab" size="sm">{playlist.trackCount}</Badge>
      </div>
    </Link>
  );
}

export default function LabPage() {
  const { data: playlists, isLoading, error } = usePlaylists();

  if (error) {
    return (
      <div>
        <Header title="Playlists" module="lab" />
        <Card><p style={{ color: 'var(--error)' }}>Failed to load playlists.</p></Card>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Playlist Laboratory"
        subtitle="Clone, clean, and remix your playlists"
        module="lab"
        actions={
          <Link href="/lab/create" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">
              ✨ Create Playlist
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      {playlists && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Playlists
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              {playlists.length}
            </div>
          </Card>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Tracks
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              {playlists.reduce((sum, p) => sum + p.trackCount, 0).toLocaleString()}
            </div>
          </Card>
          <Card padding="sm">
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Public
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              {playlists.filter((p) => p.isPublic).length}
            </div>
          </Card>
        </div>
      )}

      {/* Playlist List */}
      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Your Playlists</h2>
          <Badge variant="lab">{playlists?.length ?? '...'} playlists</Badge>
        </div>
        {isLoading ? (
          <SkeletonList count={10} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlists?.map((playlist) => (
              <PlaylistRow key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
