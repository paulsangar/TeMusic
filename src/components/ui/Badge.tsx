'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'os' | 'lab' | 'discovery' | 'spotify' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

const colorMap: Record<string, { bg: string; color: string }> = {
  default: { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' },
  os: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-os)' },
  lab: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-lab)' },
  discovery: { bg: 'rgba(236,72,153,0.15)', color: 'var(--accent-discovery)' },
  spotify: { bg: 'rgba(29,185,84,0.15)', color: 'var(--accent-spotify)' },
  success: { bg: 'rgba(34,197,94,0.15)', color: 'var(--success)' },
  warning: { bg: 'rgba(245,158,11,0.15)', color: 'var(--warning)' },
  error: { bg: 'rgba(239,68,68,0.15)', color: 'var(--error)' },
};

export default function Badge({ children, variant = 'default', size = 'sm', style }: BadgeProps) {
  const colors = colorMap[variant];
  const sizeStyles = size === 'sm'
    ? { fontSize: '11px', padding: '3px 8px' }
    : { fontSize: '13px', padding: '4px 12px' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase' as const,
        background: colors.bg,
        color: colors.color,
        ...sizeStyles,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
