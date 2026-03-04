export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ChapterStatus {
  DRAFT = 'draft',
  REVIEWING = 'reviewing',
  REVISION = 'revision',
  COMPLETED = 'completed',
}

export interface WritingStyle {
  tone: 'formal' | 'colloquial' | 'lyrical' | 'humorous';
  perspective: 'first_person' | 'third_person_limited' | 'third_person_omniscient';
}

export interface ProjectSettings {
  mainCharacters: { name: string; description: string }[];
  worldBuilding: string;
}

export interface PlotOutlineItem {
  chapterNumber: number;
  goal: string;
  keyEvents: string;
  notes?: string;
}

export interface GenerationContext {
  projectId: string;
  chapterNumber: number;
  genre: string;
  subGenre?: string;
  synopsis: string;
  writingStyle: WritingStyle;
  settings: ProjectSettings;
  userGuidance?: string;
  previousChapters?: { chapterNumber: number; summary: string }[];
  chapterOutline?: { goal: string; keyEvents: string; notes?: string };
}

export interface StreamChunk {
  type: 'text_delta' | 'message_complete';
  text?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export interface SSEEvent {
  type: 'stage_start' | 'content_delta' | 'stage_complete' | 'review_result' | 'complete' | 'error' | 'summary_generated';
  data: Record<string, unknown>;
}
