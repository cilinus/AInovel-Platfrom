'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  email?: string;
  nickname: string;
  profileImage?: string;
  role: string;
  tokenBalance: number;
  bio?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
        }),

      setAccessToken: (accessToken) =>
        set((state) => {
          state.accessToken = accessToken;
        }),

      setHasHydrated: (v) =>
        set((state) => {
          state._hasHydrated = v;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
        }),
    })),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: unknown) => {
        return persistedState as Pick<AuthState, 'user' | 'accessToken' | 'isAuthenticated'>;
      },
      onRehydrateStorage: () => (state) => {
        // NOTE: useAuthStore is in TDZ here (create() hasn't returned yet).
        // Only do non-store work; _hasHydrated is set after store creation below.
        if (state?.accessToken) {
          apiClient.setAccessToken(state.accessToken);
        }
      },
    },
  ),
);

// Hydration flag - MUST be after store creation to avoid TDZ.
// Synchronous localStorage hydration completes during create(),
// so by this point the store is already hydrated.
if (typeof window !== 'undefined') {
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.getState().setHasHydrated(true);
  }
  // Safety net for async storage adapters
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.getState().setHasHydrated(true);
  });
}
