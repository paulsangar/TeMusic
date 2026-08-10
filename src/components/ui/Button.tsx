'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'spotify' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    background: linear-gradient(135deg, var(--accent-brand), #7c3aed);
    color: white;
    border: none;
  `,
  secondary: `
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  `,
  ghost: `
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
  `,
  spotify: `
    background: var(--accent-spotify);
    color: white;
    border: none;
  `,
  danger: `
    background: var(--error);
    color: white;
    border: none;
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'padding: 6px 14px; font-size: 13px; border-radius: var(--radius-sm);',
  md: 'padding: 10px 20px; font-size: 14px; border-radius: var(--radius-md);',
  lg: 'padding: 14px 28px; font-size: 16px; border-radius: var(--radius-lg);',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyle = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    text-decoration: none;
    outline: none;
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${(disabled || isLoading) ? 'opacity: 0.5; cursor: not-allowed;' : ''}
  `;

  return (
    <button
      disabled={disabled || isLoading}
      style={Object.assign(
        {},
        ...baseStyle.split(';').filter(Boolean).map(rule => {
          const [key, value] = rule.split(':').map(s => s.trim());
          if (!key || !value) return {};
          const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          return { [camelKey]: value };
        }),
        style,
      )}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
      }}
      {...props}
    >
      {isLoading ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
