'use client';

import React from 'react';
import useSWR from 'swr';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonList, SkeletonCard } from '@/components/ui/Skeleton';
import type { UnexploredArtist, SpotifyPlaylistItem, DiscoveryHighlight } from '@/types';

import { fetcher } from '@/lib/fetcher';

export default function DiscoveryPage() {
  const swrOptions = { revalidateOnFocus: false, shouldRetryOnError: false };
  const { data: unexplored, isLoading: loadingUnexplored, error: unexploredError } = useSWR<UnexploredArtist[]>('/api/discovery/unexplored', fetcher, swrOptions);
  const { data: publicData, isLoading: loadingPublic, error: publicError } = useSWR<{ featured: SpotifyPlaylistItem[]; forYou: SpotifyPlaylistItem[]; topGenres: string[] }>('/api/discovery/public-playlists', fetcher, swrOptions);
  const { data: highlights, isLoading: loadingHighlights, error: highlightsError } = useSWR<DiscoveryHighlight[]>('/api/discovery/highlights', fetcher, swrOptions);

  return (
    <div>
      <Header
        title="Discovery Hub"
        subtitle="Explore music you've been missing"
        module="discovery"
      />

      {/* Unexplored Artists */}
      <Card padding="lg" variant="discovery" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>🎤 Unexplored Artists</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Artists you follow but rarely play
            </p>
          </div>
          <Badge variant="discovery">{unexplored?.length ?? '...'} found</Badge>
        </div>
        {loadingUnexplored ? (
          <SkeletonList count={6} />
        ) : unexploredError ? (
          <p style={{ color: '#f87171', fontSize: '14px' }}>Could not load unexplored artists: {unexploredError.message}</p>
        ) : unexplored && unexplored.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {unexplored.slice(0, 12).map((item) => (
              <a
                key={item.artist.id}
                href={item.artist.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-discovery)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                {item.artist.images[0] ? (
                  <img
                    src={item.artist.images[item.artist.images.length > 1 ? 1 : 0]?.url}
                    alt={item.artist.name}
                    style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎤</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.artist.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {item.recentPlayCount === 0 ? 'Never played recently' : `${item.recentPlayCount} recent plays`}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            All your followed artists are well-represented in your listening! 🎉
          </p>
        )}
      </Card>

      {/* Public Playlists */}
      <Card padding="lg" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>🌍 Public Playlists For You</h2>
            {publicData?.topGenres && (
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Based on your top genres: {publicData.topGenres.join(', ')}
              </p>
            )}
          </div>
        </div>
        {loadingPublic ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : publicError ? (
          <p style={{ color: '#f87171', fontSize: '14px' }}>Could not load public playlists: {publicError.message}</p>
        ) : publicData && [...(publicData.forYou || []), ...(publicData.featured || [])].length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[...(publicData.forYou || []), ...(publicData.featured || [])].slice(0, 12).map((pl) => (
              <a
                key={pl.id}
                href={pl.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  transition: 'all var(--transition-base)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {pl.images[0] ? (
                  <img src={pl.images[0].url} alt={pl.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg, var(--accent-discovery), var(--accent-brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎶</div>
                )}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {pl.owner.displayName} · {pl.trackCount} tracks
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No public playlists matched your current listening profile.
          </p>
        )}
      </Card>

      {/* AI Highlights (Phase 2 stubs) */}
      <Card padding="lg">
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>✨ AI Highlights</h2>
        {loadingHighlights ? (
          <SkeletonList count={2} />
        ) : highlightsError ? (
          <p style={{ color: '#f87171', fontSize: '14px' }}>Could not load highlights: {highlightsError.message}</p>
        ) : highlights ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {highlights.map((highlight, i) => (
              <div
                key={i}
                className="glass-light"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{highlight.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{highlight.description}</p>
                <Badge variant="default" size="sm" style={{ marginTop: '8px' }}>Phase 2 — {highlight.source}</Badge>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
