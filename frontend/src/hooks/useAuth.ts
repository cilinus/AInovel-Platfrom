'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// advanced-init-once: register apiClient auth callbacks once per app load
let didInitCallbacks = false;
function initAuthCallbacks() {
  if (didInitCallbacks) return;
  didInitCallbacks = true;
  apiClient.setOnAuthFailure(() => {
    useAuthStore.getState().logout();
  });
  apiClient.setOnTokenRefreshed((newToken: string) => {
    useAuthStore.getState().setAccessToken(newToken);
  });
}

function mapApiUser(raw: any) {
  return {
    id: raw._id ?? raw.id,
    email: raw.email,
    nickname: raw.nickname,
    profileImage: raw.profileImage,
    role: (raw.role ?? 'user').toUpperCase(),
    tokenBalance: raw.tokenBalance ?? 0,
    bio: raw.bio,
    createdAt: raw.createdAt,
  };
}

export function useMe() {
  // rerender-defer-reads: subscribe only to primitive/stable values
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const didFetch = useRef(false);

  // advanced-init-once: register callbacks once per app load, not per mount
  useEffect(() => {
    initAuthCallbacks();
  }, []);

  // rerender-defer-reads: use getState() for mutations to avoid subscribing
  // to action functions that may get new references with immer + persist
  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const user = await apiClient.get<any>('/users/me');
      useAuthStore.getState().setUser(mapApiUser(user));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once after hydration if authenticated
  useEffect(() => {
    if (hasHydrated && isAuthenticated && !didFetch.current) {
      didFetch.current = true;
      fetchMe();
    }
  }, [hasHydrated, isAuthenticated, fetchMe]);

  return { loading, error, refetch: fetchMe };
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // rerender-defer-reads: use getState() for mutations, no action selectors
  const login = useCallback(
    async (data: { email: string; password: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.post<{ accessToken: string }>(
          '/auth/login',
          data,
        );
        useAuthStore.getState().setAccessToken(result.accessToken);
        apiClient.setAccessToken(result.accessToken);
        // Fetch user profile immediately after login
        const user = await apiClient.get<any>('/users/me');
        useAuthStore.getState().setUser(mapApiUser(user));
        return result;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { login, loading, error };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // rerender-defer-reads: use getState() for mutations, no action selectors
  const register = useCallback(
    async (data: { email: string; password: string; nickname: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.post<{ accessToken: string }>(
          '/auth/register',
          data,
        );
        useAuthStore.getState().setAccessToken(result.accessToken);
        apiClient.setAccessToken(result.accessToken);
        // Fetch user profile immediately after register
        const user = await apiClient.get<any>('/users/me');
        useAuthStore.getState().setUser(mapApiUser(user));
        return result;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { register, loading, error };
}

export function useLogout() {
  return useCallback(() => {
    // Clear local state first for immediate UI response
    useAuthStore.getState().logout();
    apiClient.setAccessToken(null);
    if (typeof window !== 'undefined') {
      try { sessionStorage.removeItem('mock-user-role'); } catch { /* ignore */ }
    }
    // Server logout (best effort, fire-and-forget)
    apiClient.post('/auth/logout').catch(() => {});
  }, []);
}
