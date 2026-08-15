'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import type { TeMusUser } from '@/types';
import { ApiError, fetcher } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<TeMusUser | null>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const user: TeMusUser | null = data ?? null;
  const isAuthenticated = !!user && !error;
  const isUnauthorized = error instanceof ApiError && error.status === 401;
  const isServiceError = Boolean(error) && !isUnauthorized;

  const logout = useCallback(async () => {
    await fetcher('/api/auth/logout', { method: 'POST' });
    await mutate(null, false);
    router.replace('/');
  }, [mutate, router]);

  const login = useCallback(() => {
    router.push('/api/auth/login');
  }, [router]);

  return {
    user,
    isAuthenticated,
    isUnauthorized,
    isServiceError,
    isLoading,
    error,
    login,
    logout,
    mutate,
  };
}
