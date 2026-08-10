'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import type { TeMusUser } from '@/types';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const user: TeMusUser | null = data?.data ?? null;
  const isAuthenticated = !!user && !error;

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    mutate(null, false);
    window.location.href = '/';
  }, [mutate]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    mutate,
  };
}
