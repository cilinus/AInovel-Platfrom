'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Genre } from '@/src/constants/genres';
import type {
  GenerationStatus,
  NovelProject,
  PlotOutlineItem,
  ProjectSettings,
  WritingTone,
  Perspective,
} from '@/src/types/novel';

interface NovelState {
  projects: NovelProject[];
  currentProject: NovelProject | null;
  generationStatus: GenerationStatus;
  streamingContent: string;
  settings: ProjectSettings;
  plotOutline: PlotOutlineItem[];
  error: string | null;
  isEditing: boolean;
  editingContent: string;
}

interface NovelActions {
  setGenre: (genre: Genre | null) => void;
  setSubGenre: (subGenre: string | null) => void;
  setSynopsis: (synopsis: string) => void;
  setWritingTone: (tone: WritingTone) => void;
  setPerspective: (perspective: Perspective) => void;
  setTargetLength: (length: number) => void;
  appendContent: (text: string) => void;
  clearContent: () => void;
  setStatus: (status: GenerationStatus) => void;
  setError: (error: string | null) => void;
  setCurrentProject: (project: NovelProject | null) => void;
  setProjects: (projects: NovelProject[]) => void;
  setPlotOutline: (items: PlotOutlineItem[]) => void;
  clearGenerationState: () => void;
  setEditing: (editing: boolean) => void;
  setEditingContent: (content: string) => void;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  genre: null,
  subGenre: null,
  synopsis: '',
  writingTone: 'formal',
  perspective: 'third_person_omniscient',
  targetLength: 3000,
};

export const useNovelStore = create<NovelState & NovelActions>()(
  persist(
    immer((set) => ({
      projects: [],
      currentProject: null,
      generationStatus: 'idle',
      streamingContent: '',
      settings: { ...DEFAULT_SETTINGS },
      plotOutline: [],
      error: null,
      isEditing: false,
      editingContent: '',

      setGenre: (genre) =>
        set((state) => {
          state.settings.genre = genre;
          state.settings.subGenre = null;
        }),

      setSubGenre: (subGenre) =>
        set((state) => {
          state.settings.subGenre = subGenre;
        }),

      setSynopsis: (synopsis) =>
        set((state) => {
          state.settings.synopsis = synopsis;
        }),

      setWritingTone: (tone) =>
        set((state) => {
          state.settings.writingTone = tone;
        }),

      setPerspective: (perspective) =>
        set((state) => {
          state.settings.perspective = perspective;
        }),

      setTargetLength: (length) =>
        set((state) => {
          state.settings.targetLength = length;
        }),

      appendContent: (text) =>
        set((state) => {
          state.streamingContent += text;
        }),

      clearContent: () =>
        set((state) => {
          state.streamingContent = '';
        }),

      setStatus: (status) =>
        set((state) => {
          state.generationStatus = status;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setCurrentProject: (project) =>
        set((state) => {
          state.currentProject = project;
        }),

      setProjects: (projects) =>
        set((state) => {
          state.projects = projects;
        }),

      setPlotOutline: (items) =>
        set((state) => {
          state.plotOutline = items;
        }),

      clearGenerationState: () =>
        set((state) => {
          state.generationStatus = 'idle';
          state.streamingContent = '';
          state.error = null;
        }),

      setEditing: (editing) =>
        set((state) => {
          state.isEditing = editing;
        }),

      setEditingContent: (content) =>
        set((state) => {
          state.editingContent = content;
        }),
    })),
    {
      name: 'novel-storage',
      version: 2,
      migrate: () => ({
        settings: { ...DEFAULT_SETTINGS },
      }),
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
);