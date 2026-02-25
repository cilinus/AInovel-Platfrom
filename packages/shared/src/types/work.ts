import type { Genre } from '../constants/genres';

export enum WorkStatus {
  DRAFT = 'DRAFT',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
}

export type ContentType = 'HUMAN' | 'AI' | 'HYBRID';

export interface Work {
  id: string;
  authorId: string;
  title: string;
  synopsis: string;
  coverImageUrl?: string;
  genre: Genre;
  subGenres: string[];
  tags: string[];
  status: WorkStatus;
  isAiGenerated: boolean;
  contentType: ContentType;
  totalEpisodes: number;
  freeEpisodeCount: number;
  pricePerEpisode: number;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkListQuery {
  genre?: Genre;
  status?: WorkStatus;
  isAiGenerated?: boolean;
  tags?: string[];
  sort?: 'latest' | 'popular' | 'rating';
  page?: number;
  limit?: number;
  search?: string;
}

export interface WorkCreateRequest {
  title: string;
  synopsis: string;
  genre: Genre;
  subGenres?: string[];
  tags?: string[];
  freeEpisodeCount?: number;
  pricePerEpisode?: number;
  coverImageUrl?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}
