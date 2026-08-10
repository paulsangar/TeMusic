'use client';

import React, { useState } from 'react';
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
  const { data: playlists, isLoading, error, mutate } = usePlaylists();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaylists = playlists?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (error) {
    return (
      <div>
        <Header title="Playlists" module="lab" />
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Failed to load playlists
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {error instanceof Error ? error.message : 'Could not fetch your Spotify playlists.'}
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

      {/* Playlist List with Search */}
      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Your Playlists</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '320px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="🔍 Search playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <Badge variant="lab">{filteredPlaylists?.length ?? 0} found</Badge>
          </div>
        </div>
        {isLoading ? (
          <SkeletonList count={10} />
        ) : filteredPlaylists && filteredPlaylists.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredPlaylists.map((playlist, idx) => (
              <PlaylistRow key={`${playlist.id}-${idx}`} playlist={playlist} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
            {searchQuery ? `No playlists matching "${searchQuery}"` : 'No playlists found in your Spotify account.'}
          </p>
        )}
      </Card>
    </div>
  );
}
