'use client';

import Button from '@/components/ui/Button';

export default function AuthServiceUnavailable({ onRetry }: { onRetry: () => void }) {
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
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '32px' }}>⚠️</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Authentication service unavailable
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px' }}>
        TeMusc could not verify your session because the data service is unavailable. Your Spotify session was not discarded.
      </p>
      <Button variant="primary" size="md" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
