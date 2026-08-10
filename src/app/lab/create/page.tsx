'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { usePlaylistActions } from '@/hooks/usePlaylist';

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { createThemedPlaylist, isLoading, error } = usePlaylistActions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seedArtists, setSeedArtists] = useState('');
  const [seedGenres, setSeedGenres] = useState('');
  const [duration, setDuration] = useState(60);
  const [isPublic, setIsPublic] = useState(false);
  const [result, setResult] = useState<{ playlistId: string; trackCount: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const artistIds = seedArtists.split(',').map((s) => s.trim()).filter(Boolean);
    const genres = seedGenres.split(',').map((s) => s.trim()).filter(Boolean);

    const data = await createThemedPlaylist({
      name,
      description,
      seedArtists: artistIds.length > 0 ? artistIds : undefined,
      seedGenres: genres.length > 0 ? genres : undefined,
      targetDurationMinutes: duration,
      isPublic,
    });

    if (data) setResult(data);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div>
      <Header
        title="Create Themed Playlist"
        subtitle="Generate a new playlist from seeds and mood parameters"
        module="lab"
      />

      {result ? (
        <Card padding="lg" variant="lab">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Playlist Created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              &quot;{name}&quot; with {result.trackCount} tracks has been added to your Spotify.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a href={`https://open.spotify.com/playlist/${result.playlistId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="spotify" size="md">Open in Spotify ↗</Button>
              </a>
              <Button variant="secondary" size="md" onClick={() => { setResult(null); setName(''); }}>
                Create Another
              </Button>
              <Button variant="ghost" size="md" onClick={() => router.push('/lab')}>
                Back to Library
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="lg">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Playlist Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Themed Playlist"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for your playlist"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Seed Artist IDs (comma-separated)</label>
                <input
                  type="text"
                  value={seedArtists}
                  onChange={(e) => setSeedArtists(e.target.value)}
                  placeholder="e.g. 4NHQUGzhtTLFvgF5SZesLK, 0du5cEVh5yTK9QJze8zA0C"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Find artist IDs in Spotify URLs (e.g., spotify.com/artist/ARTIST_ID)
                </p>
              </div>

              <div>
                <label style={labelStyle}>Seed Genres (comma-separated)</label>
                <input
                  type="text"
                  value={seedGenres}
                  onChange={(e) => setSeedGenres(e.target.value)}
                  placeholder="e.g. indie-pop, electronic, hip-hop"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Target Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={10}
                    max={300}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} />
                      Private
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} />
                      Public
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <p style={{ color: 'var(--error)', fontSize: '13px' }}>❌ {error}</p>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                  ✨ Create Playlist
                </Button>
                <Button type="button" variant="ghost" size="md" onClick={() => router.push('/lab')}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
