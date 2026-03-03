'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      theme: 'system',
      sidebarOpen: false,

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),
    })),
    {
      name: 'app-storage',
      version: 1,
      partialize: (state) => ({ theme: state.theme }),
      migrate: (persistedState: unknown) => {
        return persistedState as Pick<AppState, 'theme'>;
      },
    },
  ),
);
