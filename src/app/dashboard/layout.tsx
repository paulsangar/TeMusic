'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="animate-pulse-soft" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-discovery))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: 'white',
              margin: '0 auto 16px',
            }}
          >
            T
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading TeMusc...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '32px' }}>🔒</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Authentication Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
          Your session could not be verified. Please log in again with Spotify.
        </p>
        <button
          onClick={() => { window.location.href = '/api/auth/login'; }}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-spotify)',
            color: 'white',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width)',
          padding: '24px 32px',
          transition: 'margin-left var(--transition-base)',
          maxWidth: 'calc(100vw - var(--sidebar-width))',
        }}
      >
        {children}
      </main>
    </div>
  );
}
