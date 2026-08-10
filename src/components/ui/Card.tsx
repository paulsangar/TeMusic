'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'os' | 'lab' | 'discovery';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  style,
  variant = 'default',
  hover = false,
  padding = 'md',
  onClick,
}: CardProps) {
  const glowClass = variant !== 'default' ? `glow-${variant}` : '';
  const hoverClass = hover ? 'glass-hover' : '';
  const paddingMap = { sm: '12px', md: '20px', lg: '28px' };

  return (
    <div
      className={`glass ${glowClass} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: paddingMap[padding],
        transition: 'all var(--transition-base)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
