export interface Episode {
  id: string;
  workId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  authorNote?: string;
  aiMetadata?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    generationTime: number;
  };
  createdAt: string;
}

export interface EpisodeCreateRequest {
  workId: string;
  title: string;
  content: string;
  price?: number;
  isFree?: boolean;
  authorNote?: string;
  publishNow?: boolean;
  scheduledAt?: string;
}

export interface ReadingProgress {
  episodeId: string;
  workId: string;
  progress: number; // 0-100
  lastPosition: number; // scroll position or page number
  lastReadAt: string;
}
