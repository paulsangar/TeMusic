'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const detail = params.get('detail');
      if (err) {
        let msg = `Authentication Error: ${err}`;
        if (err === 'state_mismatch') {
          msg = 'Session state mismatch. Please ensure you are accessing http://127.0.0.1:3000.';
        } else if (err === 'access_denied') {
          msg = 'Spotify authorization access was denied.';
        } else if (err === 'auth_failed') {
          msg = detail ? `Authentication failed: ${decodeURIComponent(detail)}` : 'Authentication failed. Please try again.';
        }
        setErrorMessage(msg);
      }
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background effects */}
      <div
        className="bg-grid"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-discovery))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              color: 'white',
            }}
          >
            T
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Te<span style={{ color: 'var(--accent-brand)' }}>Musc</span>
          </span>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className={mounted ? 'animate-fade-in-up' : ''}
          style={{ maxWidth: '720px', opacity: mounted ? undefined : 0 }}
        >
          {errorMessage && (
            <div
              style={{
                marginBottom: '24px',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left',
              }}
            >
              <span>⚠️ {errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {/* Module pills */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'OS', color: 'var(--accent-os)', desc: 'Metrics' },
              { label: 'LAB', color: 'var(--accent-lab)', desc: 'Playlists' },
              { label: 'DISCOVERY', color: 'var(--accent-discovery)', desc: 'Explore' },
            ].map((mod) => (
              <div
                key={mod.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: `${mod.color}12`,
                  border: `1px solid ${mod.color}30`,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: mod.color,
                  }}
                />
                <span style={{ color: mod.color }}>{mod.label}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{mod.desc}</span>
              </div>
            ))}
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '20px',
              color: 'var(--text-primary)',
            }}
          >
            Your Musical{' '}
            <span className="text-gradient-brand">Operating System</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto 36px',
            }}
          >
            Analyze your listening habits, manage playlists with precision,
            and discover music you&apos;ve been missing — all powered by your Spotify data.
          </p>

          {/* CTA */}
          <Button
            variant="spotify"
            size="lg"
            onClick={() => { window.location.href = '/api/auth/login'; }}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            }
          >
            Connect with Spotify
          </Button>

          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginTop: '16px',
            }}
          >
            Free and open source · No data stored on external servers
          </p>
        </div>

        {/* Feature cards */}
        <div
          className={mounted ? 'animate-fade-in-up' : ''}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            maxWidth: '900px',
            width: '100%',
            marginTop: '72px',
            opacity: mounted ? undefined : 0,
            animationDelay: '200ms',
          }}
        >
          {[
            {
              icon: '📊',
              title: 'TeMusc OS',
              desc: 'Dashboard with your top tracks, artists, listening patterns, and activity heatmaps.',
              color: 'var(--accent-os)',
              gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.02))',
            },
            {
              icon: '🧪',
              title: 'TeMusc LAB',
              desc: 'Clone, clean, and remix playlists. Remove duplicates, create themed mixes from seeds.',
              color: 'var(--accent-lab)',
              gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))',
            },
            {
              icon: '🔭',
              title: 'TeMusc DISCOVERY',
              desc: 'Find artists you follow but never play, explore curated public playlists matching your taste.',
              color: 'var(--accent-discovery)',
              gradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.02))',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass"
              style={{
                padding: '28px 24px',
                borderRadius: 'var(--radius-lg)',
                background: feature.gradient,
                transition: 'all var(--transition-base)',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${feature.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{feature.icon}</div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: feature.color,
                  marginBottom: '8px',
                }}
              >
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        Built with Spotify Web API · TeMusc {new Date().getFullYear()}
      </footer>
    </div>
  );
}
