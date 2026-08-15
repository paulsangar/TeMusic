'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and preferences" />

      {/* Account Info */}
      <Card padding="lg" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Account</h2>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', border: '3px solid var(--accent-brand)' }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-discovery))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.displayName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <Badge variant="spotify">Spotify Connected</Badge>
                {user.country && <Badge variant="default">{user.country}</Badge>}
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
          <Button variant="danger" size="sm" onClick={logout}>
            Disconnect & Logout
          </Button>
        </div>
      </Card>

      {/* Alert Preferences (Phase 1: display only) */}
      <Card padding="lg" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Alert Preferences</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
          Configure which alerts you want to receive (coming in a future update).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Weekly Metrics Summary', desc: 'Your listening stats each week' },
            { label: 'Discovery Alerts', desc: 'New unexplored artists and playlists' },
            { label: 'Playlist Health', desc: 'Duplicate warnings and cleanup suggestions' },
          ].map((pref) => (
            <div
              key={pref.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{pref.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{pref.desc}</div>
              </div>
              <Badge variant="default">Planned</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* About */}
      <Card padding="lg">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>About TeMusc</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          TeMusc is your personal music operating system. It connects to your Spotify account to analyze listening habits,
          manage playlists intelligently, and discover music you&apos;ve been missing.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Badge variant="os">OS</Badge>
          <Badge variant="lab">LAB</Badge>
          <Badge variant="discovery">DISCOVERY</Badge>
          <Badge variant="default">Phase 1 — v0.1.0</Badge>
        </div>
      </Card>
    </div>
  );
}
