'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { SpotifyTrackItem } from '@/types';

// Hardcoded common Spotify genres for the experiment UI
const AVAILABLE_GENRES = [
  'acoustic', 'alt-rock', 'alternative', 'ambient', 'anime', 'blues',
  'classical', 'country', 'dance', 'electronic', 'folk', 'hip-hop',
  'indie', 'jazz', 'k-pop', 'metal', 'pop', 'punk', 'r-n-b', 'rock',
];

export default function ExperimentPage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [danceability, setDanceability] = useState<number>(0.5);
  const [energy, setEnergy] = useState<number>(0.5);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SpotifyTrackItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const getRecommendations = async () => {
    if (selectedGenres.length === 0) {
      setError('Please select at least 1 genre.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lab/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedGenres: selectedGenres,
          danceability,
          energy,
          limit: 20,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch recommendations');
      }

      setResults(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Laboratory: Experiment"
        subtitle="Discover new music by tuning Spotify's recommendation algorithm"
        module="lab"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Controls Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card padding="md">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Seed Genres (Max 5)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    style={{
                      background: isSelected ? 'var(--accent-lab)' : 'var(--bg-surface-hover)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="md">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Audio Features</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Danceability</span>
                <span style={{ color: 'var(--accent-lab)', fontWeight: 600 }}>{Math.round(danceability * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={danceability} 
                onChange={(e) => setDanceability(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-lab)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Energy</span>
                <span style={{ color: 'var(--accent-lab)', fontWeight: 600 }}>{Math.round(energy * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={energy} 
                onChange={(e) => setEnergy(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-lab)' }}
              />
            </div>

            <Button 
              variant="primary" 
              size="md" 
              onClick={getRecommendations}
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              🧪 Generate Potions
            </Button>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>{error}</div>}
          </Card>
        </div>

        {/* Results Area */}
        <Card padding="lg">
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Results</h2>
          
          {isLoading ? (
            <SkeletonList count={8} />
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((track, i) => (
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
                    background: 'var(--bg-surface-hover)',
                  }}
                >
                  {track.album?.images?.[0] && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{track.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {track.artists.map(a => a.name).join(', ')}
                    </div>
                  </div>
                  <Badge variant="lab" size="sm">🔥 {track.popularity}</Badge>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🧪</div>
              <p>Select your ingredients on the left to discover new music.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
