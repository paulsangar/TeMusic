'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { usePlaylistActions } from '@/hooks/usePlaylist';

interface PresetTheme {
  title: string;
  emoji: string;
  name: string;
  description: string;
  genres: string;
  duration: number;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    title: 'Workout Energy',
    emoji: '⚡',
    name: '⚡ High Energy Workout Mix',
    description: 'Upbeat high-energy tracks for training & workout sessions.',
    genres: 'pop, electronic, dance',
    duration: 60,
  },
  {
    title: 'Late Night Focus',
    emoji: '🌙',
    name: '🌙 Late Night Focus & Flow',
    description: 'Atmospheric and chill tracks for deep concentration.',
    genres: 'ambient, chill, indie',
    duration: 90,
  },
  {
    title: 'Top Latin Hits',
    emoji: '🔥',
    name: '🔥 Top Latin & Regional Mix',
    description: 'Hot Latin hits, reggaeton, and regional tracks.',
    genres: 'latin, reggaeton, salsa',
    duration: 60,
  },
  {
    title: 'Rock & Classics',
    emoji: '🎸',
    name: '🎸 Classic Rock & Guitar Anthems',
    description: 'Timeless guitar anthems and classic rock hits.',
    genres: 'rock, classic-rock, hard-rock',
    duration: 75,
  },
];

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { createThemedPlaylist, isLoading, error } = usePlaylistActions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seedGenres, setSeedGenres] = useState('');
  const [duration, setDuration] = useState(60);
  const [isPublic, setIsPublic] = useState(false);
  const [result, setResult] = useState<{ playlistId: string; trackCount: number } | null>(null);

  const applyPreset = (preset: PresetTheme) => {
    setName(preset.name);
    setDescription(preset.description);
    setSeedGenres(preset.genres);
    setDuration(preset.duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const genres = seedGenres.split(',').map((s) => s.trim()).filter(Boolean);

    const data = await createThemedPlaylist({
      name: name || 'My Custom Playlist',
      description,
      seedGenres: genres.length > 0 ? genres : ['pop', 'latin'],
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
        title="Create Playlist"
        subtitle="Quickly generate a custom playlist from theme presets or genres"
        module="lab"
      />

      {/* Preset Themes Selector */}
      <Card padding="md" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
          ✨ Quick Presets (1-Click Theme Fill)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => applyPreset(preset)}
              className="glass-hover"
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{preset.emoji}</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{preset.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {preset.genres}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {result ? (
        <Card padding="lg" variant="lab">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Playlist Created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              &quot;{name}&quot; with {result.trackCount} tracks has been added to your Spotify account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a href={`https://open.spotify.com/playlist/${result.playlistId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="spotify" size="md">Open in Spotify ↗</Button>
              </a>
              <Button variant="secondary" size="md" onClick={() => { setResult(null); setName(''); }}>
                Create Another
              </Button>
              <Button variant="ghost" size="md" onClick={() => router.push('/lab')}>
                Back to Playlists
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
                  placeholder="e.g. My Energy Mix"
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
                  placeholder="Optional playlist description"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-lab)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Genres (comma-separated)</label>
                <input
                  type="text"
                  value={seedGenres}
                  onChange={(e) => setSeedGenres(e.target.value)}
                  placeholder="e.g. latin, pop, rock, electronic"
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
