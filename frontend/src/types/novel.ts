import { Genre } from '@/src/constants/genres';

export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

export type WritingTone = 'formal' | 'colloquial' | 'lyrical' | 'humorous';
export type Perspective = 'first_person' | 'third_person_limited' | 'third_person_omniscient';

export const WRITING_TONE_LABELS: Record<WritingTone, string> = {
  formal: '격식체',
  colloquial: '구어체',
  lyrical: '서정적',
  humorous: '유머러스',
};

export const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  first_person: '1인칭',
  third_person_limited: '3인칭 제한적',
  third_person_omniscient: '3인칭 전지적',
};

export interface ProjectSettings {
  genre: Genre | null;
  subGenre: string | null;
  synopsis: string;
  writingTone: WritingTone;
  perspective: Perspective;
  targetLength: number;
}

export interface PlotOutlineItem {
  chapterNumber: number;
  goal: string;
  keyEvents: string;
  notes?: string;
}

export interface WritingStyle {
  tone: WritingTone;
  perspective: Perspective;
}

export interface NovelChapter {
  _id: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  content: string;
  summary?: string;
  status: string;
  wordCount: number;
  aiMetadata?: {
    tokenCost?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface NovelProjectSettings {
  mainCharacters?: string[];
  worldBuilding?: string;
}

export interface NovelProject {
  _id: string;
  title: string;
  genre: Genre;
  subGenre?: string;
  synopsis: string;
  writingStyle: {
    tone: WritingTone;
    perspective: Perspective;
  };
  settings?: NovelProjectSettings;
  status: string;
  totalChapters: number;
  totalWordCount: number;
  totalTokensSpent: number;
  plotOutline?: PlotOutlineItem[];
  createdAt: string;
  updatedAt: string;
}

export type SSEEventType =
  | 'stage_start'
  | 'stage_complete'
  | 'content_delta'
  | 'summary_generated'
  | 'complete'
  | 'error';

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

export const GENRE_COLORS: Record<Genre, string> = {
  [Genre.ROMANCE]: '#ec4899',
  [Genre.FANTASY]: '#8b5cf6',
  [Genre.MARTIAL_ARTS]: '#f59e0b',
  [Genre.MODERN]: '#3b82f6',
  [Genre.MYSTERY]: '#64748b',
  [Genre.SF]: '#06b6d4',
};

export const DRAFT_COST = 50;