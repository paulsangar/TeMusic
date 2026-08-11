'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useMetricsOverview } from '@/hooks/useSpotifyData';
import type { SpotifyTrackItem, SpotifyArtistItem } from '@/types';
import type { TimeRange } from '@/lib/spotify/types';

type TimeRangeTab = { key: TimeRange; label: string };
const timeRanges: TimeRangeTab[] = [
  { key: 'short_term', label: '4 Weeks' },
  { key: 'medium_term', label: '6 Months' },
  { key: 'long_term', label: 'All Time' },
];

function KPICard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {value}
          </div>
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function TrackRow({ track, index }: { track: SpotifyTrackItem; index: number }) {
  const minutes = Math.floor(track.durationMs / 60000);
  const seconds = Math.floor((track.durationMs % 60000) / 1000).toString().padStart(2, '0');

  return (
    <a
      href={track.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fade-in"
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
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '24px', textAlign: 'center', fontWeight: 600 }}>
        {index + 1}
      </span>
      {track.album?.images?.[0] && (
        <img
          src={track.album.images[track.album.images.length > 1 ? 1 : 0]?.url}
          alt={track.album.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            objectFit: 'cover',
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
          {track.album?.releaseYear && <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>· {track.album.releaseYear}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{minutes}:{seconds}</span>
        <Badge variant="default" size="sm">🔥 {track.popularity}</Badge>
      </div>
    </a>
  );
}

function ArtistRow({ artist, index }: { artist: SpotifyArtistItem; index: number }) {
  return (
    <a
      href={artist.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fade-in"
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
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '24px', textAlign: 'center', fontWeight: 600 }}>
        {index + 1}
      </span>
      {artist.images?.[0] && (
        <img
          src={artist.images[artist.images.length > 1 ? 1 : 0]?.url}
          alt={artist.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {artist.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {artist.genres?.slice(0, 3).join(', ') || 'No genres specified'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Badge variant="os" size="sm">👥 {artist.followers ? artist.followers.toLocaleString() : '0'}</Badge>
        <Badge variant="discovery" size="sm">⭐ {artist.popularity}</Badge>
      </div>
    </a>
  );
}

function ActivityBar({ data }: { data: Record<number, number> }) {
  const maxVal = Math.max(...Object.values(data), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px' }}>
      {hours.map((hour) => {
        const count = data[hour] || 0;
        const heightPct = (count / maxVal) * 100;
        return (
          <div
            key={hour}
            title={`${hour}:00 — ${count} tracks`}
            style={{
              flex: 1,
              height: `${Math.max(heightPct, 4)}%`,
              borderRadius: '3px 3px 0 0',
              background: count > 0
                ? `linear-gradient(to top, var(--accent-os), rgba(59,130,246,0.4))`
                : 'var(--bg-surface-hover)',
              transition: 'height var(--transition-slow)',
              cursor: 'pointer',
            }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { data: overview, isLoading, error, mutate } = useMetricsOverview();
  const [kpiRange, setKpiRange] = useState<TimeRange>('short_term');
  const [tracksRange, setTracksRange] = useState<TimeRange>('short_term');
  const [artistsRange, setArtistsRange] = useState<TimeRange>('short_term');
  const [isSaving, setIsSaving] = useState(false);

  const saveSnapshot = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/os/metrics/snapshot', { method: 'POST' });
    } finally {
      setIsSaving(false);
    }
  };

  const getTopTrackForKpi = (): string => {
    if (!overview) return '—';
    const map: Record<TimeRange, SpotifyTrackItem[]> = {
      short_term: overview.topTracks.shortTerm,
      medium_term: overview.topTracks.mediumTerm,
      long_term: overview.topTracks.longTerm,
    };
    return map[kpiRange]?.[0]?.name ?? '—';
  };

  const getTopArtistForKpi = (): string => {
    if (!overview) return '—';
    const map: Record<TimeRange, SpotifyArtistItem[]> = {
      short_term: overview.topArtists.shortTerm,
      medium_term: overview.topArtists.mediumTerm,
      long_term: overview.topArtists.longTerm,
    };
    return map[kpiRange]?.[0]?.name ?? '—';
  };

  const getTracksForRange = (): SpotifyTrackItem[] => {
    if (!overview) return [];
    const map: Record<TimeRange, SpotifyTrackItem[]> = {
      short_term: overview.topTracks.shortTerm,
      medium_term: overview.topTracks.mediumTerm,
      long_term: overview.topTracks.longTerm,
    };
    return map[tracksRange] || [];
  };

  const getArtistsForRange = (): SpotifyArtistItem[] => {
    if (!overview) return [];
    const map: Record<TimeRange, SpotifyArtistItem[]> = {
      short_term: overview.topArtists.shortTerm,
      medium_term: overview.topArtists.mediumTerm,
      long_term: overview.topArtists.longTerm,
    };
    return map[artistsRange] || [];
  };

  if (error) {
    return (
      <div>
        <Header title="Dashboard" module="os" />
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Failed to load listening metrics
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              {error instanceof Error ? error.message : 'Spotify API or server error occurred.'}
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
        title="Dashboard"
        subtitle="Your listening metrics at a glance"
        module="os"
        actions={
          <Button variant="secondary" size="sm" onClick={saveSnapshot} isLoading={isSaving}>
            📸 Save Snapshot
          </Button>
        }
      />

      {/* Range Selector Bar for KPI Cards */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Overview Period
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {timeRanges.map((tr) => (
            <button
              key={tr.key}
              onClick={() => setKpiRange(tr.key)}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                background: kpiRange === tr.key ? 'var(--accent-os)' : 'var(--bg-surface)',
                color: kpiRange === tr.key ? 'white' : 'var(--text-secondary)',
              }}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KPICard
          label="Tracks Played"
          value={overview?.activitySummary.totalTracksThisWeek ?? '—'}
          icon="🎵"
          color="var(--accent-os)"
        />
        <KPICard
          label="Unique Artists"
          value={overview?.activitySummary.uniqueArtistsThisWeek ?? '—'}
          icon="🎤"
          color="var(--accent-discovery)"
        />
        <KPICard
          label="Top Track"
          value={getTopTrackForKpi()}
          icon="🏆"
          color="var(--accent-lab)"
        />
        <KPICard
          label="Top Artist"
          value={getTopArtistForKpi()}
          icon="⭐"
          color="var(--accent-spotify)"
        />
      </div>

      {/* Activity Chart */}
      <Card padding="lg" className="animate-fade-in" variant="os">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Listening Activity by Hour
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Based on your last 50 played tracks
            </p>
          </div>
          <Badge variant="os">Live Data</Badge>
        </div>
        {isLoading ? (
          <div className="animate-shimmer" style={{ height: '100px', borderRadius: 'var(--radius-sm)' }} />
        ) : overview ? (
          <>
            <ActivityBar data={overview.activitySummary.byHour} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {[0, 6, 12, 18, 23].map((h) => (
                <span key={h} style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{h}:00</span>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      {/* Top Tracks & Artists Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Top Tracks */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Top Tracks</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {timeRanges.map((tr) => (
                <button
                  key={tr.key}
                  onClick={() => setTracksRange(tr.key)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: tracksRange === tr.key ? 'var(--accent-os)' : 'transparent',
                    color: tracksRange === tr.key ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={10} />
          ) : getTracksForRange().length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '24px', textAlign: 'center' }}>
              No top tracks found for this period.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '500px', overflowY: 'auto' }}>
              {getTracksForRange().map((track, i) => (
                <TrackRow key={`${track.id}-${i}`} track={track} index={i} />
              ))}
            </div>
          )}
        </Card>

        {/* Top Artists */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Top Artists</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {timeRanges.map((tr) => (
                <button
                  key={tr.key}
                  onClick={() => setArtistsRange(tr.key)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: artistsRange === tr.key ? 'var(--accent-os)' : 'transparent',
                    color: artistsRange === tr.key ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <SkeletonList count={10} />
          ) : getArtistsForRange().length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '24px', textAlign: 'center' }}>
              No top artists found for this period.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '500px', overflowY: 'auto' }}>
              {getArtistsForRange().map((artist, i) => (
                <ArtistRow key={`${artist.id}-${i}`} artist={artist} index={i} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recently Played */}
      <Card padding="lg" className="animate-fade-in" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Recently Played
        </h2>
        {isLoading ? (
          <SkeletonList count={8} />
        ) : !overview?.recentlyPlayed || overview.recentlyPlayed.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '24px', textAlign: 'center' }}>
            No recently played tracks found.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '400px', overflowY: 'auto' }}>
            {overview?.recentlyPlayed.slice(0, 20).map((item, i) => (
              <div
                key={`${item.track.id}-${item.playedAt}`}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {item.track.album.images[0] && (
                  <img
                    src={item.track.album.images[item.track.album.images.length > 1 ? 1 : 0]?.url}
                    alt={item.track.album.name}
                    style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.track.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.track.artists.map((a) => a.name).join(', ')}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {new Date(item.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
