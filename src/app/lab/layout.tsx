'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AuthServiceUnavailable from '@/components/auth/AuthServiceUnavailable';
import { useAuth } from '@/hooks/useAuth';

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isServiceError, mutate } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isServiceError) router.replace('/');
  }, [isAuthenticated, isLoading, isServiceError, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse-soft" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading TeMusc...</div>
      </div>
    );
  }

  if (isServiceError) {
    return <AuthServiceUnavailable onRetry={() => { void mutate(); }} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '24px 32px', maxWidth: 'calc(100vw - var(--sidebar-width))' }}>
        {children}
      </main>
    </div>
  );
}
