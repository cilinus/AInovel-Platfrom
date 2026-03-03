'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ReaderSettings {
  fontSize: number;
  fontFamily: 'serif' | 'sans';
  lineHeight: number;
  bgColor: string;
  mode: 'scroll' | 'page';
}

interface ReaderState {
  settings: ReaderSettings;
  currentPage: number;
  totalPages: number;
  isToolbarVisible: boolean;

  updateSettings: (partial: Partial<ReaderSettings>) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  toggleToolbar: () => void;
  readingPercentage: () => number;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    immer((set, get) => ({
      settings: {
        fontSize: 16,
        fontFamily: 'serif',
        lineHeight: 1.8,
        bgColor: '#ffffff',
        mode: 'scroll',
      },
      currentPage: 0,
      totalPages: 1,
      isToolbarVisible: false,

      updateSettings: (partial) =>
        set((state) => {
          Object.assign(state.settings, partial);
        }),

      setCurrentPage: (page) =>
        set((state) => {
          state.currentPage = page;
        }),

      setTotalPages: (total) =>
        set((state) => {
          state.totalPages = total;
        }),

      toggleToolbar: () =>
        set((state) => {
          state.isToolbarVisible = !state.isToolbarVisible;
        }),

      readingPercentage: () => {
        const { currentPage, totalPages } = get();
        return totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
      },
    })),
    {
      name: 'reader-settings',
      version: 1,
      partialize: (state) => ({ settings: state.settings }),
      migrate: (persistedState: unknown) => {
        return persistedState as Pick<ReaderState, 'settings'>;
      },
    },
  ),
);
