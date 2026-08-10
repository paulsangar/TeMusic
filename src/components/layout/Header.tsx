'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  module?: 'os' | 'lab' | 'discovery';
  actions?: React.ReactNode;
}

const moduleLabels: Record<string, { label: string; color: string }> = {
  os: { label: 'TeMusc OS', color: 'var(--accent-os)' },
  lab: { label: 'TeMusc LAB', color: 'var(--accent-lab)' },
  discovery: { label: 'TeMusc DISCOVERY', color: 'var(--accent-discovery)' },
};

export default function Header({ title, subtitle, module, actions }: HeaderProps) {
  const { user, logout } = useAuth();
  const moduleInfo = module ? moduleLabels[module] : null;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div>
        {moduleInfo && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: moduleInfo.color,
              marginBottom: '4px',
            }}
          >
            {moduleInfo.label}
          </div>
        )}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {actions}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {user.email}
              </div>
            </div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--border-default)',
                  cursor: 'pointer',
                }}
                onClick={logout}
                title="Click to logout"
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-discovery))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  cursor: 'pointer',
                }}
                onClick={logout}
                title="Click to logout"
              >
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
